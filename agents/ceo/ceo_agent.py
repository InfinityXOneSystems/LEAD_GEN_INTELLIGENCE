"""
agents/ceo/ceo_agent.py
========================
CEO Agent — top-level strategic decision maker.

Responsibilities:
- Evaluate business opportunities from discovery/intelligence
- Prioritize agent tasks and pipeline runs
- Generate executive decisions and strategic direction
- Coordinate with vision, prediction, and strategy agents
- Produce executive briefings
"""

from __future__ import annotations

import logging
import time
from typing import Any

try:
    from agents.base_agent import BaseAgent
except ImportError:
    import abc

    class BaseAgent(abc.ABC):  # type: ignore[no-redef]
        agent_name: str = "base_agent"
        max_retries: int = 2
        retry_delay: float = 1.0

        def __init__(self) -> None:
            self._run_id = None
            self._queue = None

        @abc.abstractmethod
        async def execute(self, task: dict, context: dict | None = None) -> dict: ...

        def emit_event(self, *_: Any, **__: Any) -> None: ...
        def capabilities(self) -> list[str]: return []
        def health(self) -> dict: return {"agent": self.agent_name, "status": "ok"}

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Strategic scoring constants
# ---------------------------------------------------------------------------

_OPPORTUNITY_SIGNALS = {
    "high_demand": 30,
    "low_competition": 25,
    "scalable": 20,
    "recurring_revenue": 15,
    "fast_payback": 10,
}

_PRIORITY_WEIGHTS = {
    "revenue_impact": 0.40,
    "strategic_fit": 0.30,
    "execution_ease": 0.20,
    "time_sensitivity": 0.10,
}


class CEOAgent(BaseAgent):
    """
    CEO Agent — strategic decision maker for the XPS Intelligence Platform.

    Commands handled via :meth:`execute`:

    * ``"evaluate opportunity"``  — score and assess a business opportunity
    * ``"strategic briefing"``    — produce an executive summary
    * ``"prioritize tasks"``      — rank incoming tasks by strategic value
    * ``"executive report"``      — generate a structured executive report

    Returns dicts containing ``success``, ``decision``, ``rationale``, and
    ``next_steps`` keys.
    """

    agent_name = "ceo_agent"

    # ------------------------------------------------------------------
    # Public execute interface
    # ------------------------------------------------------------------

    async def execute(
        self,
        task: dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        command = (task.get("command") or "").lower()
        ctx = context or {}

        self.emit_event("ceo.execute", {"command": command})
        logger.info("[%s] Executing command: %s", self.agent_name, command)

        if "evaluate opportunity" in command:
            return self._evaluate_opportunity(task, ctx)
        if "strategic briefing" in command or "briefing" in command:
            return self._strategic_briefing(task, ctx)
        if "prioritize" in command:
            return self._prioritize_tasks(task, ctx)
        if "executive report" in command or "report" in command:
            return self._executive_report(task, ctx)

        return {
            "success": False,
            "decision": "unrecognised_command",
            "rationale": f"CEO agent does not handle command: '{command}'",
            "next_steps": ["clarify command", "consult strategy agent"],
        }

    # ------------------------------------------------------------------
    # Capabilities
    # ------------------------------------------------------------------

    def capabilities(self) -> list[str]:
        return [
            "evaluate opportunity",
            "strategic briefing",
            "prioritize tasks",
            "executive report",
        ]

    # ------------------------------------------------------------------
    # Internal handlers
    # ------------------------------------------------------------------

    def _evaluate_opportunity(
        self, task: dict[str, Any], ctx: dict[str, Any]
    ) -> dict[str, Any]:
        opportunity = task.get("opportunity") or ctx.get("opportunity") or {}
        signals = opportunity.get("signals", list(_OPPORTUNITY_SIGNALS.keys())[:3])

        score = sum(_OPPORTUNITY_SIGNALS.get(s, 5) for s in signals)
        score = min(score, 100)

        if score >= 70:
            tier = "HIGH"
            decision = "pursue"
        elif score >= 45:
            tier = "MEDIUM"
            decision = "investigate_further"
        else:
            tier = "LOW"
            decision = "defer"

        rationale = (
            f"Opportunity scored {score}/100 ({tier} tier) based on signals: "
            + ", ".join(signals)
            + "."
        )

        return {
            "success": True,
            "decision": decision,
            "opportunity_score": score,
            "tier": tier,
            "rationale": rationale,
            "next_steps": self._next_steps_for_decision(decision),
            "evaluated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def _strategic_briefing(
        self, task: dict[str, Any], ctx: dict[str, Any]
    ) -> dict[str, Any]:
        period = ctx.get("period", "current quarter")
        focus_areas = ctx.get("focus_areas", ["lead generation", "outreach", "pipeline health"])

        briefing_lines = [
            f"Executive Strategic Briefing — {period}",
            "",
            "KEY FOCUS AREAS:",
        ]
        for i, area in enumerate(focus_areas, 1):
            briefing_lines.append(f"  {i}. {area.title()}")

        briefing_lines += [
            "",
            "RECOMMENDED ACTIONS:",
            "  • Accelerate top-tier lead pipeline",
            "  • Strengthen outreach personalisation",
            "  • Monitor scraper health and data quality",
            "  • Review scoring thresholds monthly",
        ]

        return {
            "success": True,
            "decision": "briefing_generated",
            "rationale": f"Strategic briefing produced for {period}.",
            "briefing": "\n".join(briefing_lines),
            "next_steps": ["share with team", "schedule execution review"],
        }

    def _prioritize_tasks(
        self, task: dict[str, Any], ctx: dict[str, Any]
    ) -> dict[str, Any]:
        tasks: list[dict[str, Any]] = task.get("tasks") or ctx.get("tasks") or []

        if not tasks:
            tasks = [
                {"name": "scraper health check", "revenue_impact": 0.8, "strategic_fit": 0.6, "execution_ease": 0.9, "time_sensitivity": 0.7},
                {"name": "enrich cold leads", "revenue_impact": 0.7, "strategic_fit": 0.8, "execution_ease": 0.5, "time_sensitivity": 0.4},
                {"name": "send outreach batch", "revenue_impact": 0.9, "strategic_fit": 0.9, "execution_ease": 0.7, "time_sensitivity": 0.8},
            ]

        def _score(t: dict[str, Any]) -> float:
            return sum(
                t.get(k, 0.5) * w for k, w in _PRIORITY_WEIGHTS.items()
            )

        ranked = sorted(tasks, key=_score, reverse=True)
        for rank, t in enumerate(ranked, 1):
            t["priority_rank"] = rank
            t["priority_score"] = round(_score(t), 3)

        return {
            "success": True,
            "decision": "tasks_prioritised",
            "rationale": "Tasks ranked by weighted strategic value (revenue × fit × ease × urgency).",
            "prioritized_tasks": ranked,
            "next_steps": ["dispatch top-ranked task first", "re-prioritize after each completion"],
        }

    def _executive_report(
        self, task: dict[str, Any], ctx: dict[str, Any]
    ) -> dict[str, Any]:
        metrics = ctx.get("metrics", {
            "leads_discovered": 0,
            "leads_enriched": 0,
            "outreach_sent": 0,
            "pipeline_health": "unknown",
        })

        report = {
            "title": "XPS Intelligence — Executive Report",
            "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "metrics_summary": metrics,
            "strategic_status": "on_track",
            "risk_flags": [],
            "recommendations": [
                "Continue daily scraper runs to grow lead database",
                "Focus enrichment on HOT-tier leads",
                "Automate follow-up sequences for unresponsive leads",
            ],
        }

        if metrics.get("leads_discovered", 0) == 0:
            report["risk_flags"].append("No leads discovered — scraper may be stalled")
            report["strategic_status"] = "at_risk"

        return {
            "success": True,
            "decision": "report_generated",
            "rationale": "Executive report compiled from current platform metrics.",
            "report": report,
            "next_steps": ["review risk flags", "act on recommendations"],
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _next_steps_for_decision(decision: str) -> list[str]:
        mapping = {
            "pursue": ["assign resources", "set milestones", "begin execution"],
            "investigate_further": ["conduct market research", "run simulation", "reassess in 2 weeks"],
            "defer": ["log for quarterly review", "monitor signals"],
        }
        return mapping.get(decision, ["review decision criteria"])
