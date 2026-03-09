"""
app/runtime/runtime_controller.py
===================================
Main orchestration entry point.

Flow:
  1. Validate command via command_validator
  2. Enforce policies via policy_engine
  3. Check circuit breaker via error_manager
  4. Create task in task_state_store
  5. Enqueue task for async execution
  6. Return (task_id, "queued")
"""

import logging
from typing import Any, Dict, Optional, Tuple

from app.queue.queue_manager import enqueue_local
from app.queue.task_state_store import TaskState, get_store
from app.runtime.command_validator import validate_command
from app.runtime.error_manager import format_error, is_circuit_open, record_failure
from app.runtime.policy_engine import enforce

logger = logging.getLogger(__name__)


class RuntimeController:
    """Orchestrates command intake, validation, and task enqueuing."""

    def __init__(self) -> None:
        self._store = get_store()

    def submit_command(
        self,
        command: str,
        target: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        client_id: str = "default",
    ) -> Tuple[str, str]:
        """
        Validate, apply policies, create a task, and enqueue it.

        :returns: (task_id, "queued")
        :raises ValidationError: For schema issues.
        :raises PolicyViolation: For policy violations.
        :raises RuntimeError: If circuit breaker is open.
        """
        # 1. Validate schema
        cmd, tgt, params = validate_command(command, target, parameters)

        # 2. Policy enforcement
        enforce(cmd, params, client_id=client_id)

        # 3. Circuit breaker check
        if is_circuit_open(cmd):
            raise RuntimeError(
                f"Circuit breaker is open for command '{cmd}'. "
                "Too many recent failures — try again later."
            )

        # 4. Create task
        task = self._store.create(command=cmd, target=tgt, parameters=params)
        task.add_log(f"Task created for command '{cmd}'")

        # 5. Enqueue for async execution
        payload: Dict[str, Any] = {
            "task_id": task.task_id,
            "command": cmd,
            "target": tgt,
            "parameters": params,
        }
        enqueue_local(payload)
        task.add_log("Task enqueued for execution")

        logger.info("submitted command=%s task_id=%s", cmd, task.task_id)
        return task.task_id, TaskState.STATUS_QUEUED

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Return task state dict, or None if not found."""
        task = self._store.get(task_id)
        if task is None:
            return None
        return task.to_dict()

    def list_tasks(self, limit: int = 50) -> list:
        """Return recent tasks as a list of dicts."""
        return self._store.list_recent(limit=limit)

    def handle_task_failure(self, task_id: str, command: str, exc: Exception) -> None:
        """Mark a task as failed and update circuit breaker."""
        self._store.update_status(task_id, TaskState.STATUS_FAILED)
        self._store.add_log(task_id, f"FAILED: {exc}")
        record_failure(command)
        logger.error("task %s failed (command=%s): %s", task_id, command, exc)

    def handle_task_success(self, task_id: str, command: str) -> None:
        """Mark a task as completed."""
        from app.runtime.error_manager import record_success

        self._store.update_status(task_id, TaskState.STATUS_COMPLETED)
        record_success(command)
        logger.info("task %s completed (command=%s)", task_id, command)


def _handle_error(task_id: str, exc: Exception) -> Dict[str, Any]:
    """Convenience wrapper to format errors for API responses."""
    return format_error(exc, task_id=task_id)


_controller: Optional[RuntimeController] = None


def get_controller() -> RuntimeController:
    """Return the module-level RuntimeController singleton."""
    global _controller
    if _controller is None:
        _controller = RuntimeController()
    return _controller
