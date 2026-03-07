"""
executor.py – Tool executor with gate enforcement.

The executor will NEVER run a tool without first passing all gates.

Flow:
  1. Run all gates (command_gate → plan_gate → tool_gate per step)
  2. Execute each plan step via the registered tool handler
  3. Validate result (min leads threshold)
  4. Retry scraper once if leads < MIN_LEADS
  5. Return ExecutionResult
"""

from __future__ import annotations

import logging
import time
from typing import Any, Callable, Dict, List, Optional

from .gates import GateError, run_all_gates
from .state_manager import StateManager
from .validator import ExecutionResult, Plan

logger = logging.getLogger("agent_core.executor")

MIN_LEADS = 5
MAX_RETRIES = 1

# ---------------------------------------------------------------------------
# Tool registry
# ---------------------------------------------------------------------------

ToolHandler = Callable[[Dict[str, Any]], Dict[str, Any]]

_TOOL_REGISTRY: Dict[str, ToolHandler] = {}


def register_tool(name: str, handler: ToolHandler) -> None:
    """Register a callable handler for a named tool."""
    _TOOL_REGISTRY[name] = handler


def _default_playwright_scraper(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stub Playwright scraper.

    In a live environment this would launch a Playwright browser and
    scrape lead data.  The stub returns a minimal result so the
    pipeline can complete in CI / test environments.
    """
    logger.info("playwright_scraper: params=%s", params)
    # Real implementation would use playwright to scrape
    try:
        from playwright.async_api import async_playwright  # type: ignore  # noqa: F401
        logger.debug("Playwright is available")
    except ImportError:
        logger.debug("Playwright not installed – returning stub leads")

    return {"leads": [], "leads_found": 0}


def _default_email_generator(params: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("email_generator: params=%s", params)
    return {"emails_generated": 0}


def _default_lead_analyzer(params: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("lead_analyzer: params=%s", params)
    return {"high_value": 0}


def _default_calendar_tool(params: Dict[str, Any]) -> Dict[str, Any]:
    logger.info("calendar_tool: params=%s", params)
    return {"scheduled": 0}


# Register defaults (can be overridden at runtime)
register_tool("playwright_scraper", _default_playwright_scraper)
register_tool("email_generator", _default_email_generator)
register_tool("lead_analyzer", _default_lead_analyzer)
register_tool("calendar_tool", _default_calendar_tool)


# ---------------------------------------------------------------------------
# Executor
# ---------------------------------------------------------------------------


class Executor:
    def __init__(self, state_manager: Optional[StateManager] = None) -> None:
        self._sm = state_manager or StateManager()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _run_tool(self, tool: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Invoke a registered tool handler (gate already verified by caller)."""
        handler = _TOOL_REGISTRY.get(tool)
        if handler is None:
            raise RuntimeError(f"No handler registered for tool '{tool}'")
        return handler(params or {})

    def _execute_plan(self, plan: Plan, run_id: str) -> ExecutionResult:
        """Execute all steps in the plan and aggregate results."""
        leads_found = 0
        high_value = 0
        errors: List[str] = []

        for step in plan.steps:
            self._sm.update(run_id, {"current_step": step.tool, "status": "running"})
            try:
                result = self._run_tool(step.tool, step.params or {})
                leads_found += result.get("leads_found", 0)
                high_value += result.get("high_value", 0)
                logger.info("step '%s' completed: %s", step.tool, result)
            except Exception as exc:
                msg = f"step '{step.tool}' failed: {exc}"
                logger.error(msg)
                errors.append(msg)

        return ExecutionResult(
            success=len(errors) == 0,
            leads_found=leads_found,
            high_value=high_value,
            errors=errors,
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def execute(
        self,
        raw_command: Dict[str, Any],
        plan: Plan,
        run_id: Optional[str] = None,
    ) -> ExecutionResult:
        """
        Execute a plan after passing all gates.

        Parameters
        ----------
        raw_command:
            The original command dict (used by command_gate).
        plan:
            The validated Plan produced by the planner.
        run_id:
            Optional caller-supplied run identifier.

        Returns
        -------
        ExecutionResult
        """
        run_id = run_id or str(int(time.time() * 1000))
        self._sm.create(run_id, {"status": "gate_check", "command": raw_command})

        # ── Gate check ────────────────────────────────────────────────
        try:
            run_all_gates(raw_command, plan)
        except GateError as exc:
            logger.error("Gate failed: %s", exc)
            self._sm.update(run_id, {"status": "gate_failed", "error": str(exc)})
            return ExecutionResult(
                success=False,
                message=str(exc),
                errors=[str(exc)],
            )

        self._sm.update(run_id, {"status": "executing"})

        # ── First execution attempt ───────────────────────────────────
        result = self._execute_plan(plan, run_id)

        # ── Result validation + retry ─────────────────────────────────
        if not result.success or result.leads_found < MIN_LEADS:
            logger.warning(
                "Insufficient leads (%d < %d) – retrying scraper",
                result.leads_found,
                MIN_LEADS,
            )
            retry_result = self._execute_plan(plan, run_id)
            retry_result.retried = True

            if retry_result.leads_found >= MIN_LEADS:
                self._sm.update(run_id, {"status": "completed_after_retry"})
                return retry_result

            # Both attempts failed – return fallback
            logger.error(
                "Retry also yielded insufficient leads (%d) – returning fallback",
                retry_result.leads_found,
            )
            self._sm.update(run_id, {"status": "fallback"})
            return ExecutionResult(
                success=False,
                leads_found=retry_result.leads_found,
                high_value=retry_result.high_value,
                message=(
                    f"Insufficient leads found after retry ({retry_result.leads_found}). "
                    "Try a broader search term or different location."
                ),
                errors=result.errors + retry_result.errors,
                retried=True,
            )

        self._sm.update(
            run_id,
            {
                "status": "completed",
                "leads_found": result.leads_found,
                "high_value": result.high_value,
            },
        )
        return result
