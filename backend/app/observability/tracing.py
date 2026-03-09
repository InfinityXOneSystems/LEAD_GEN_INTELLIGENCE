"""
app/observability/tracing.py
=============================
Lightweight span-based tracing for task execution.
"""

import threading
import time
import uuid
from typing import Any, Dict, List, Optional


class Span:
    """Represents a single traced operation."""

    def __init__(self, name: str, trace_id: Optional[str] = None) -> None:
        self.span_id = str(uuid.uuid4())[:8]
        self.trace_id = trace_id or str(uuid.uuid4())[:8]
        self.name = name
        self.start_time = time.time()
        self.end_time: Optional[float] = None
        self.attributes: Dict[str, Any] = {}
        self.error: Optional[str] = None

    def set_attribute(self, key: str, value: Any) -> None:
        self.attributes[key] = value

    def set_error(self, message: str) -> None:
        self.error = message

    def finish(self) -> None:
        self.end_time = time.time()

    @property
    def duration_ms(self) -> Optional[float]:
        if self.end_time is None:
            return None
        return round((self.end_time - self.start_time) * 1000, 2)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "span_id": self.span_id,
            "trace_id": self.trace_id,
            "name": self.name,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "duration_ms": self.duration_ms,
            "attributes": self.attributes,
            "error": self.error,
        }


class Tracer:
    """Simple in-memory tracer."""

    def __init__(self, max_spans: int = 1000) -> None:
        self._spans: List[Span] = []
        self._lock = threading.Lock()
        self._max_spans = max_spans

    def start_span(self, name: str, trace_id: Optional[str] = None) -> Span:
        span = Span(name=name, trace_id=trace_id)
        with self._lock:
            self._spans.append(span)
            if len(self._spans) > self._max_spans:
                self._spans = self._spans[-self._max_spans :]
        return span

    def get_recent(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._lock:
            return [s.to_dict() for s in self._spans[-limit:]]

    def clear(self) -> None:
        with self._lock:
            self._spans.clear()


_tracer: Tracer = Tracer()


def get_tracer() -> Tracer:
    return _tracer


def trace_task(task_id: str, command: str) -> Span:
    """Start a span for a task execution."""
    span = _tracer.start_span(name=f"task.{command}", trace_id=task_id[:8])
    span.set_attribute("task_id", task_id)
    span.set_attribute("command", command)
    return span
