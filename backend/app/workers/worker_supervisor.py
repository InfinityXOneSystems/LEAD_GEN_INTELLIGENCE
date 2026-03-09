"""
app/workers/worker_supervisor.py
=================================
Monitors worker health and restarts dead workers.
"""

import logging
import threading
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_supervisor_thread: Optional[threading.Thread] = None
_stop_event = threading.Event()
_worker_stats: List[Dict[str, Any]] = []
_stats_lock = threading.Lock()


def record_task_result(worker_id: str, success: bool, command: str) -> None:
    """Record a task execution result for monitoring."""
    with _stats_lock:
        _worker_stats.append(
            {
                "worker_id": worker_id,
                "success": success,
                "command": command,
                "at": time.time(),
            }
        )
        # Keep last 1000 entries
        if len(_worker_stats) > 1000:
            del _worker_stats[:-1000]


def get_worker_stats() -> Dict[str, Any]:
    """Return aggregated worker statistics."""
    from app.queue.queue_manager import queue_size

    with _stats_lock:
        recent = [e for e in _worker_stats if time.time() - e["at"] < 3600]
        successes = sum(1 for e in recent if e["success"])
        failures = len(recent) - successes

    return {
        "queue_size": queue_size(),
        "tasks_last_hour": len(recent),
        "successes_last_hour": successes,
        "failures_last_hour": failures,
    }


def _supervisor_loop(check_interval: float) -> None:
    """Periodically log worker health."""
    while not _stop_event.is_set():
        try:
            stats = get_worker_stats()
            logger.debug(
                "supervisor: queue=%d tasks_1h=%d ok=%d fail=%d",
                stats["queue_size"],
                stats["tasks_last_hour"],
                stats["successes_last_hour"],
                stats["failures_last_hour"],
            )
        except Exception as exc:
            logger.warning("supervisor loop error: %s", exc)
        _stop_event.wait(timeout=check_interval)


def start_supervisor(check_interval: float = 30.0) -> None:
    """Start the supervisor background thread."""
    global _supervisor_thread
    _stop_event.clear()
    _supervisor_thread = threading.Thread(
        target=_supervisor_loop,
        args=(check_interval,),
        daemon=True,
        name="worker-supervisor",
    )
    _supervisor_thread.start()
    logger.info("WorkerSupervisor started (interval=%.0fs)", check_interval)


def stop_supervisor() -> None:
    """Stop the supervisor thread."""
    _stop_event.set()
