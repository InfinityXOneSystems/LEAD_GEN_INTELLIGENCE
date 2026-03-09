"""
app/queue/task_state_store.py
==============================
Thread-safe in-memory task state store with optional Redis persistence.
"""

import threading
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


class TaskState:
    STATUS_QUEUED = "queued"
    STATUS_RUNNING = "running"
    STATUS_COMPLETED = "completed"
    STATUS_FAILED = "failed"

    def __init__(
        self,
        task_id: str,
        command: str,
        target: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
    ):
        self.task_id = task_id
        self.command = command
        self.target = target
        self.parameters = parameters or {}
        self.status = self.STATUS_QUEUED
        self.logs: List[str] = []
        self.result: Optional[Dict[str, Any]] = None
        self.error: Optional[str] = None
        self.created_at = datetime.utcnow().isoformat()
        self.updated_at = self.created_at

    def add_log(self, message: str) -> None:
        entry = f"[{datetime.utcnow().isoformat()}] {message}"
        self.logs.append(entry)
        if len(self.logs) > 500:
            self.logs = self.logs[-500:]
        self.updated_at = datetime.utcnow().isoformat()

    def set_status(self, status: str) -> None:
        self.status = status
        self.updated_at = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "command": self.command,
            "target": self.target,
            "parameters": self.parameters,
            "status": self.status,
            "logs": self.logs[-100:],
            "result": self.result,
            "error": self.error,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class TaskStateStore:
    """Thread-safe in-memory store for task state."""

    def __init__(self) -> None:
        self._store: Dict[str, TaskState] = {}
        self._lock = threading.Lock()

    def create(
        self,
        command: str,
        target: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> TaskState:
        task_id = str(uuid.uuid4())
        task = TaskState(
            task_id=task_id, command=command, target=target, parameters=parameters
        )
        with self._lock:
            self._store[task_id] = task
        return task

    def get(self, task_id: str) -> Optional[TaskState]:
        with self._lock:
            return self._store.get(task_id)

    def update_status(self, task_id: str, status: str) -> bool:
        with self._lock:
            task = self._store.get(task_id)
            if task is None:
                return False
            task.set_status(status)
            return True

    def add_log(self, task_id: str, message: str) -> bool:
        with self._lock:
            task = self._store.get(task_id)
            if task is None:
                return False
            task.add_log(message)
            return True

    def list_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            tasks = sorted(
                self._store.values(), key=lambda t: t.created_at, reverse=True
            )
            return [t.to_dict() for t in tasks[:limit]]

    def stats(self) -> Dict[str, int]:
        with self._lock:
            counts: Dict[str, int] = {}
            for task in self._store.values():
                counts[task.status] = counts.get(task.status, 0) + 1
            return counts


# Module-level singleton
_store: Optional[TaskStateStore] = None


def get_store() -> TaskStateStore:
    global _store
    if _store is None:
        _store = TaskStateStore()
    return _store
