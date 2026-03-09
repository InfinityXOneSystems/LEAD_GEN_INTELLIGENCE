"""
app/workers/worker_runtime.py
==============================
Worker runtime: binds WorkerNode instances to the queue manager and starts them.
"""

import logging
from typing import Any, Dict

from app.queue.queue_manager import enqueue_local, start_workers
from app.workers.worker_node import WorkerNode

logger = logging.getLogger(__name__)

_NUM_WORKERS = 2


def _make_dispatch_fn(worker: WorkerNode):
    def dispatch_task(payload: Dict[str, Any]) -> None:
        worker.execute(payload)

    return dispatch_task


def start_worker_pool(num_workers: int = _NUM_WORKERS) -> None:
    """
    Start *num_workers* WorkerNode threads bound to the local queue.

    This is called once at application startup from the lifespan hook.
    """
    if num_workers < 1:
        num_workers = 1

    # Use the first worker's dispatch fn for the pool (workers share the queue)
    first_worker = WorkerNode(worker_id="worker-0")
    dispatch_fn = _make_dispatch_fn(first_worker)
    start_workers(dispatch_fn, num_workers=num_workers)

    # Additional workers run in their own threads via queue_manager
    logger.info("WorkerRuntime: %d worker(s) started", num_workers)


def submit_task(payload: Dict[str, Any]) -> None:
    """Convenience function to enqueue a task payload directly."""
    enqueue_local(payload)
