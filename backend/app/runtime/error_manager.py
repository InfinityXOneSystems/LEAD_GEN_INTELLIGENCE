"""
app/runtime/error_manager.py
=============================
Centralised error handling, circuit breaker, and structured error reporting.
"""

import logging
import threading
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

# Circuit-breaker state per agent/command key
_cb_state: Dict[str, Dict[str, Any]] = {}
_cb_lock = threading.Lock()

CB_FAILURE_THRESHOLD = 5  # failures before opening circuit
CB_RESET_TIMEOUT = 60.0  # seconds before attempting half-open
CB_STATE_CLOSED = "closed"
CB_STATE_OPEN = "open"
CB_STATE_HALF_OPEN = "half_open"


def _circuit_key(command: str) -> str:
    return f"cb:{command}"


def record_failure(command: str) -> Dict[str, Any]:
    """Record a failure for *command* and potentially open the circuit breaker."""
    key = _circuit_key(command)
    with _cb_lock:
        state = _cb_state.setdefault(
            key,
            {
                "status": CB_STATE_CLOSED,
                "failures": 0,
                "last_failure_at": None,
                "opened_at": None,
            },
        )
        state["failures"] += 1
        state["last_failure_at"] = time.monotonic()
        if (
            state["failures"] >= CB_FAILURE_THRESHOLD
            and state["status"] == CB_STATE_CLOSED
        ):
            state["status"] = CB_STATE_OPEN
            state["opened_at"] = time.monotonic()
            logger.error(
                "Circuit breaker OPENED for command '%s' after %d failures",
                command,
                state["failures"],
            )
        return dict(state)


def record_success(command: str) -> None:
    """Record a success and close the circuit breaker if it was half-open."""
    key = _circuit_key(command)
    with _cb_lock:
        state = _cb_state.get(key)
        if state and state["status"] in (CB_STATE_HALF_OPEN, CB_STATE_OPEN):
            state["status"] = CB_STATE_CLOSED
            state["failures"] = 0
            logger.info("Circuit breaker CLOSED for command '%s'", command)
        elif state:
            state["failures"] = 0


def is_circuit_open(command: str) -> bool:
    """Return True if the circuit breaker is open (should reject requests)."""
    key = _circuit_key(command)
    with _cb_lock:
        state = _cb_state.get(key)
        if state is None:
            return False
        if state["status"] == CB_STATE_OPEN:
            # Check if reset timeout has elapsed → transition to half-open
            if time.monotonic() - (state["opened_at"] or 0) > CB_RESET_TIMEOUT:
                state["status"] = CB_STATE_HALF_OPEN
                logger.info("Circuit breaker HALF-OPEN for command '%s'", command)
                return False
            return True
        return False


def get_circuit_status(command: str) -> Optional[Dict[str, Any]]:
    """Return circuit breaker state for *command*, or None if never recorded."""
    key = _circuit_key(command)
    with _cb_lock:
        state = _cb_state.get(key)
        if state is None:
            return None
        return {
            "command": command,
            "status": state["status"],
            "failures": state["failures"],
        }


def all_circuit_status() -> Dict[str, Any]:
    """Return all circuit breaker states."""
    with _cb_lock:
        return {
            k.replace("cb:", ""): {
                "status": v["status"],
                "failures": v["failures"],
            }
            for k, v in _cb_state.items()
        }


def format_error(exc: Exception, task_id: Optional[str] = None) -> Dict[str, Any]:
    """Format an exception into a structured error dict."""
    return {
        "task_id": task_id,
        "error_type": type(exc).__name__,
        "error_message": str(exc),
    }


def reset_all() -> None:
    """Reset all circuit breaker state (useful in tests)."""
    with _cb_lock:
        _cb_state.clear()
