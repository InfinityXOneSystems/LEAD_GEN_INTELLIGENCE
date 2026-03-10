"""
app/api/v1/runtime.py
======================
REST endpoints for the runtime command architecture.

POST /runtime/command       — submit a command for execution
GET  /runtime/task/{task_id} — poll task status and logs
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from app.runtime.command_schema import (
    RuntimeCommandRequest,
    RuntimeCommandResponse,
    TaskStatusResponse,
)
from app.runtime.error_manager import (
    CommandValidationError,
    TaskDispatchError,
    format_error,
)
from app.runtime.runtime_controller import get_runtime_controller

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/runtime", tags=["runtime"])


@router.post(
    "/command",
    response_model=RuntimeCommandResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Submit a runtime command",
    description=(
        "Receives a natural-language or structured command from the frontend LLM interface, "
        "validates it, routes it to the appropriate agent, enqueues the task, and returns "
        "a task_id and initial status."
    ),
)
def post_runtime_command(payload: RuntimeCommandRequest) -> RuntimeCommandResponse:
    controller = get_runtime_controller()
    try:
        return controller.execute(payload)
    except CommandValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=format_error(exc),
        ) from exc
    except TaskDispatchError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error(exc),
        ) from exc
    except Exception as exc:
        logger.exception("runtime_command_unexpected_error")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=format_error(exc),
        ) from exc


@router.get(
    "/task/{task_id}",
    response_model=TaskStatusResponse,
    summary="Get task status",
    description="Poll the current status, result, and execution logs for a submitted task.",
)
def get_task_status(task_id: str) -> TaskStatusResponse:
    controller = get_runtime_controller()
    result = controller.get_task_status(task_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": f"Task {task_id!r} not found"},
        )
    return result
