"""
app/observability/metrics.py
==============================
Application metrics collection for the runtime system.
"""

import threading
import time
from typing import Any, Dict


class RuntimeMetrics:
    """Thread-safe metrics counters for the runtime."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._counters: Dict[str, int] = {}
        self._gauges: Dict[str, float] = {}
        self._start_time = time.time()

    def increment(self, key: str, amount: int = 1) -> None:
        with self._lock:
            self._counters[key] = self._counters.get(key, 0) + amount

    def gauge(self, key: str, value: float) -> None:
        with self._lock:
            self._gauges[key] = value

    def get(self, key: str) -> int:
        with self._lock:
            return self._counters.get(key, 0)

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "uptime_seconds": round(time.time() - self._start_time, 1),
                "counters": dict(self._counters),
                "gauges": dict(self._gauges),
            }


_metrics: RuntimeMetrics = RuntimeMetrics()


def get_metrics() -> RuntimeMetrics:
    return _metrics


def record_command_received(command: str) -> None:
    _metrics.increment("commands_received")
    _metrics.increment(f"command.{command}.received")


def record_command_completed(command: str) -> None:
    _metrics.increment("commands_completed")
    _metrics.increment(f"command.{command}.completed")


def record_command_failed(command: str) -> None:
    _metrics.increment("commands_failed")
    _metrics.increment(f"command.{command}.failed")


def record_task_queued() -> None:
    _metrics.increment("tasks_queued")


def record_task_started() -> None:
    _metrics.increment("tasks_started")


def record_task_completed() -> None:
    _metrics.increment("tasks_completed")


def record_task_failed() -> None:
    _metrics.increment("tasks_failed")
