"""
app/observability/agent_logs.py
=================================
Centralised agent activity log with ring-buffer storage.
"""

import threading
import time
from typing import Any, Dict, List, Optional


class AgentLogEntry:
    __slots__ = ("agent", "task_id", "level", "message", "timestamp")

    def __init__(
        self, agent: str, task_id: Optional[str], level: str, message: str
    ) -> None:
        self.agent = agent
        self.task_id = task_id
        self.level = level
        self.message = message
        self.timestamp = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent": self.agent,
            "task_id": self.task_id,
            "level": self.level,
            "message": self.message,
            "timestamp": self.timestamp,
        }


class AgentActivityFeed:
    """Thread-safe ring-buffer for agent log entries."""

    def __init__(self, max_entries: int = 500) -> None:
        self._entries: List[AgentLogEntry] = []
        self._lock = threading.Lock()
        self._max_entries = max_entries

    def log(
        self,
        agent: str,
        message: str,
        level: str = "info",
        task_id: Optional[str] = None,
    ) -> None:
        entry = AgentLogEntry(
            agent=agent, task_id=task_id, level=level, message=message
        )
        with self._lock:
            self._entries.append(entry)
            if len(self._entries) > self._max_entries:
                self._entries = self._entries[-self._max_entries :]

    def get_recent(
        self, limit: int = 100, agent: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        with self._lock:
            entries = (
                self._entries
                if agent is None
                else [e for e in self._entries if e.agent == agent]
            )
            return [e.to_dict() for e in entries[-limit:]]

    def clear(self) -> None:
        with self._lock:
            self._entries.clear()


_feed: AgentActivityFeed = AgentActivityFeed()


def get_feed() -> AgentActivityFeed:
    return _feed


def log_agent_activity(
    agent: str,
    message: str,
    level: str = "info",
    task_id: Optional[str] = None,
) -> None:
    _feed.log(agent=agent, message=message, level=level, task_id=task_id)
