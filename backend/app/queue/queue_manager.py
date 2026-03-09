"""
app/queue/queue_manager.py
==========================
Manages in-process task dispatch using a thread-safe queue + worker threads.
Tasks that cannot be pushed to Redis are executed via this local queue.
"""

import logging
import queue
import threading
from typing import Any, Callable, Dict, Optional

logger = logging.getLogger(__name__)

QUEUE_NAME = "runtime_tasks"
_local_queue: queue.Queue = queue.Queue()
_workers: list = []
_shutdown_event = threading.Event()


def _worker_loop(worker_fn: Callable[[Dict[str, Any]], None]) -> None:
    """Internal worker loop that drains the local queue."""
    while not _shutdown_event.is_set():
        try:
            payload = _local_queue.get(timeout=1)
            try:
                worker_fn(payload)
            except Exception as exc:
                logger.error("worker_fn raised: %s", exc)
            finally:
                _local_queue.task_done()
        except queue.Empty:
            continue


def start_workers(
    worker_fn: Callable[[Dict[str, Any]], None], num_workers: int = 2
) -> None:
    """Start background worker threads that call *worker_fn* for each task."""
    _shutdown_event.clear()
    for _ in range(num_workers):
        t = threading.Thread(target=_worker_loop, args=(worker_fn,), daemon=True)
        t.start()
        _workers.append(t)
    logger.info("QueueManager: started %d workers", num_workers)


def enqueue_local(payload: Dict[str, Any]) -> None:
    """Push a task payload onto the local in-process queue."""
    _local_queue.put(payload)


def queue_size() -> int:
    """Return the current local queue size."""
    return _local_queue.qsize()


def shutdown(timeout: float = 5.0) -> None:
    """Signal workers to stop and wait up to *timeout* seconds."""
    _shutdown_event.set()
    for t in _workers:
        t.join(timeout=timeout)
    _workers.clear()


_dispatch_fn: Optional[Callable[[Dict[str, Any]], None]] = None


def get_dispatch_fn() -> Optional[Callable[[Dict[str, Any]], None]]:
    return _dispatch_fn


def set_dispatch_fn(fn: Callable[[Dict[str, Any]], None]) -> None:
    global _dispatch_fn
    _dispatch_fn = fn
