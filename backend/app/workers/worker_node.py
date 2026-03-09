"""
app/workers/worker_node.py
==========================
A single worker node that dequeues and executes one task at a time.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class WorkerNode:
    """
    Executes a single task payload using the sandbox executor and command router.
    """

    def __init__(self, worker_id: str) -> None:
        self.worker_id = worker_id
        self.current_task_id: Optional[str] = None

    def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process one task payload.

        Expected payload keys: task_id, command, target, parameters
        """
        task_id = payload.get("task_id", "unknown")
        command = payload.get("command", "")
        target = payload.get("target")
        parameters = payload.get("parameters", {})

        self.current_task_id = task_id
        logger.info(
            "worker=%s executing task=%s command=%s", self.worker_id, task_id, command
        )

        from app.queue.task_state_store import TaskState, get_store
        from app.runtime.command_router import dispatch
        from app.sandbox.sandbox_executor import SandboxExecutor

        store = get_store()
        store.update_status(task_id, TaskState.STATUS_RUNNING)
        store.add_log(task_id, f"worker={self.worker_id} picked up task")

        try:
            executor = SandboxExecutor(task_id=task_id)
            result = executor.run(
                fn=dispatch,
                kwargs={
                    "command": command,
                    "task_id": task_id,
                    "target": target,
                    "parameters": parameters,
                },
                timeout=300,
            )
            store.update_status(task_id, TaskState.STATUS_COMPLETED)
            store.add_log(task_id, "Task completed successfully")
            from app.runtime.error_manager import record_success

            record_success(command)
            return result
        except Exception as exc:
            store.update_status(task_id, TaskState.STATUS_FAILED)
            store.add_log(task_id, f"Task failed: {exc}")
            from app.runtime.error_manager import record_failure

            record_failure(command)
            logger.error("worker=%s task=%s failed: %s", self.worker_id, task_id, exc)
            return {"success": False, "error": str(exc), "task_id": task_id}
        finally:
            self.current_task_id = None
