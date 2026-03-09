"""
app/queue/redis_queue.py
========================
Optional Redis-backed task queue. Falls back gracefully when Redis is unavailable.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

_redis_client: Optional[Any] = None


def _get_redis() -> Optional[Any]:
    """Return a Redis client or None if Redis is not available."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        import redis

        from app.config import settings

        client = redis.from_url(
            settings.REDIS_URL, decode_responses=True, socket_timeout=2
        )
        client.ping()
        _redis_client = client
        logger.info("Redis connected at %s", settings.REDIS_URL)
        return _redis_client
    except Exception as exc:
        logger.warning("Redis unavailable (%s); using in-memory fallback", exc)
        return None


def enqueue(queue_name: str, payload: Dict[str, Any]) -> bool:
    """Push a JSON payload onto a Redis list. Returns True on success."""
    import json

    client = _get_redis()
    if client is None:
        return False
    try:
        client.rpush(queue_name, json.dumps(payload))
        return True
    except Exception as exc:
        logger.error("enqueue failed: %s", exc)
        return False


def dequeue(queue_name: str, timeout: int = 1) -> Optional[Dict[str, Any]]:
    """Pop a payload from a Redis list (blocking). Returns None on timeout/error."""
    import json

    client = _get_redis()
    if client is None:
        return None
    try:
        result = client.blpop(queue_name, timeout=timeout)
        if result is None:
            return None
        _, raw = result
        return json.loads(raw)
    except Exception as exc:
        logger.error("dequeue failed: %s", exc)
        return None


def queue_length(queue_name: str) -> int:
    """Return the number of items in a Redis list."""
    client = _get_redis()
    if client is None:
        return 0
    try:
        return client.llen(queue_name)
    except Exception:
        return 0
