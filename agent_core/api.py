"""
api.py – FastAPI server exposing the gated agent pipeline.

Endpoints:
  POST /agent/run    – run the full PLAN → VALIDATE → EXECUTE pipeline
  GET  /agent/status – return system / dependency status
  GET  /agent/runs   – list recent run states (for debugging)

Start with:
    python -m uvicorn agent_core.api:app --reload
"""

from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, field_validator

from .executor import Executor
from .gates import GateError
from .planner import plan
from .state_manager import StateManager
from .validator import ExecutionResult

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(LOG_DIR, "api.log"), encoding="utf-8"),
    ],
)
logger = logging.getLogger("agent_core.api")

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="XPS Agent Core API",
    description=(
        "Gated autonomous agent pipeline: PLAN → VALIDATE → EXECUTE. "
        "Agents never run tools without passing validation gates."
    ),
    version="1.0.0",
)

_state_manager = StateManager()
_executor = Executor(state_manager=_state_manager)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class RunRequest(BaseModel):
    """Input to POST /agent/run."""

    command: str

    @field_validator("command")
    @classmethod
    def command_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("command must not be empty")
        if len(v) > 200:
            raise ValueError(
                f"command must not exceed 200 characters (got {len(v)})"
            )
        return v


class RunResponse(BaseModel):
    """Output from POST /agent/run."""

    run_id: str
    success: bool
    leads_found: int
    high_value: int
    message: str
    retried: bool
    errors: list


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.post("/agent/run", response_model=RunResponse)
async def run_agent(request: RunRequest) -> RunResponse:
    """
    Execute the full PLAN → VALIDATE → EXECUTE pipeline.

    Example input::

        {"command": "scrape epoxy contractors tampa"}

    Example output::

        {"leads_found": 42, "high_value": 12, ...}
    """
    run_id = str(int(time.time() * 1000))
    logger.info("run_id=%s  command=%s", run_id, request.command)

    # ── 1. Plan ──────────────────────────────────────────────────────
    try:
        agent_plan = plan(request.command)
    except Exception as exc:
        logger.error("Planning failed: %s", exc)
        raise HTTPException(status_code=422, detail=f"Planning error: {exc}") from exc

    logger.info(
        "run_id=%s  plan steps=%s",
        run_id,
        [s.tool for s in agent_plan.steps],
    )

    # ── 2 & 3. Validate + Execute (gates enforced inside executor) ────
    raw_command = agent_plan.command.model_dump()
    result: ExecutionResult = _executor.execute(raw_command, agent_plan, run_id=run_id)

    if not result.success and result.errors:
        first_error = result.errors[0] if result.errors else "unknown error"
        if "gate" in first_error.lower():
            raise HTTPException(status_code=403, detail=first_error)

    return RunResponse(
        run_id=run_id,
        success=result.success,
        leads_found=result.leads_found,
        high_value=result.high_value,
        message=result.message,
        retried=result.retried,
        errors=result.errors,
    )


@app.get("/agent/status")
async def agent_status() -> Dict[str, Any]:
    """Return system / dependency availability status."""
    langgraph_ok = False
    playwright_ok = False
    open_interpreter_ok = False

    try:
        import langgraph  # type: ignore  # noqa: F401
        langgraph_ok = True
    except ImportError:
        pass

    try:
        import playwright  # type: ignore  # noqa: F401
        playwright_ok = True
    except ImportError:
        pass

    try:
        import interpreter  # type: ignore  # noqa: F401
        open_interpreter_ok = True
    except ImportError:
        pass

    system_ready = True  # API is reachable → system is ready

    return {
        "system_ready": system_ready,
        "langgraph": langgraph_ok,
        "playwright": playwright_ok,
        "open_interpreter": open_interpreter_ok,
        "gates_active": True,
    }


@app.get("/agent/runs")
async def list_runs() -> Dict[str, Any]:
    """List all in-memory run states (for debugging)."""
    return {"runs": _state_manager.all_runs()}
