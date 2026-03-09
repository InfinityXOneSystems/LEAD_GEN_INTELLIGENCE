"""
app/api/v1/system.py
=====================
System observability endpoints.

GET /system/health  — full health check
GET /system/metrics — runtime metrics snapshot
GET /system/tasks   — recent task list
"""

from fastapi import APIRouter

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/health")
def system_health():
    """Full system health check across all subsystems."""
    from app.observability.system_health import full_health_check

    return full_health_check()


@router.get("/metrics")
def system_metrics():
    """Return current runtime metrics snapshot."""
    from app.observability.metrics import get_metrics
    from app.queue.queue_manager import queue_size
    from app.runtime.error_manager import all_circuit_status
    from app.workers.worker_supervisor import get_worker_stats

    metrics = get_metrics().snapshot()
    worker_stats = get_worker_stats()
    circuit_status = all_circuit_status()

    return {
        "metrics": metrics,
        "worker_stats": worker_stats,
        "queue_size": queue_size(),
        "circuit_breakers": circuit_status,
    }


@router.get("/tasks")
def list_tasks(limit: int = 50):
    """Return the most recent *limit* tasks."""
    from app.runtime.runtime_controller import get_controller

    controller = get_controller()
    return {"tasks": controller.list_tasks(limit=min(limit, 200))}


@router.get("/agent-activity")
def agent_activity(limit: int = 100):
    """Return recent agent activity log entries."""
    from app.observability.agent_logs import get_feed

    return {"entries": get_feed().get_recent(limit=min(limit, 500))}
