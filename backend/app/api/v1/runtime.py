"""
app/api/v1/runtime.py
======================
Runtime command execution API.

POST /runtime/command  — submit a command for async execution
GET  /runtime/task/{task_id} — poll task status + logs
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

router = APIRouter(prefix="/runtime", tags=["runtime"])


# ─── Request / Response Schemas ───────────────────────────────────────────────


class CommandRequest(BaseModel):
    command: str = Field(..., description="Command type (e.g. scrape_website)")
    target: Optional[str] = Field(None, description="Target URL, domain, or query")
    parameters: Dict[str, Any] = Field(default_factory=dict)


class CommandResponse(BaseModel):
    task_id: str
    status: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    command: Optional[str] = None
    target: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.post("/command", response_model=CommandResponse)
def submit_command(payload: CommandRequest, request: Request) -> CommandResponse:
    """
    Submit a command for asynchronous execution.

    Returns a task_id that can be polled via GET /runtime/task/{task_id}.
    """
    from app.runtime.command_validator import ValidationError
    from app.runtime.error_manager import is_circuit_open
    from app.runtime.policy_engine import PolicyViolation
    from app.runtime.runtime_controller import get_controller

    client_id = request.client.host if request.client else "unknown"
    controller = get_controller()

    try:
        task_id, status = controller.submit_command(
            command=payload.command,
            target=payload.target,
            parameters=payload.parameters,
            client_id=client_id,
        )
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except PolicyViolation as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except RuntimeError as exc:
        if is_circuit_open(payload.command):
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return CommandResponse(task_id=task_id, status=status)


@router.get("/task/{task_id}", response_model=TaskStatusResponse)
def get_task_status(task_id: str) -> TaskStatusResponse:
    """
    Retrieve the current status and logs for a task.
    """
    from app.runtime.runtime_controller import get_controller

    controller = get_controller()
    task = controller.get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task '{task_id}' not found")

    return TaskStatusResponse(
        task_id=task["task_id"],
        status=task["status"],
        command=task.get("command"),
        target=task.get("target"),
        logs=task.get("logs", []),
        result=task.get("result"),
        error=task.get("error"),
        created_at=task.get("created_at"),
        updated_at=task.get("updated_at"),
    )
