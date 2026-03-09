"""
app/runtime/retry_policy.py
============================
Retry logic with exponential back-off and jitter for task execution.
"""

import logging
import time
from typing import Any, Callable, Optional, Type

logger = logging.getLogger(__name__)

DEFAULT_MAX_RETRIES = 3
DEFAULT_BASE_DELAY = 1.0  # seconds
DEFAULT_MAX_DELAY = 30.0  # seconds
DEFAULT_BACKOFF = 2.0


class RetryExhausted(Exception):
    """Raised when all retry attempts have been exhausted."""

    def __init__(self, original: Exception, attempts: int):
        super().__init__(f"Exhausted {attempts} retries. Last error: {original}")
        self.original = original
        self.attempts = attempts


def retry(
    fn: Callable[[], Any],
    max_retries: int = DEFAULT_MAX_RETRIES,
    base_delay: float = DEFAULT_BASE_DELAY,
    max_delay: float = DEFAULT_MAX_DELAY,
    backoff: float = DEFAULT_BACKOFF,
    retryable_exceptions: Optional[tuple] = None,
) -> Any:
    """
    Execute *fn* with exponential back-off retry.

    :param fn: Zero-argument callable to retry.
    :param max_retries: Maximum number of retry attempts (not counting the first call).
    :param base_delay: Initial delay between retries in seconds.
    :param max_delay: Maximum delay cap in seconds.
    :param backoff: Multiplier applied to delay after each failure.
    :param retryable_exceptions: Tuple of exception types to retry on.
                                 Defaults to (Exception,) — retry on any error.
    :returns: Return value of *fn* on success.
    :raises RetryExhausted: After all retries are exhausted.
    """
    if retryable_exceptions is None:
        retryable_exceptions = (Exception,)

    last_exc: Optional[Exception] = None
    delay = base_delay

    for attempt in range(max_retries + 1):
        try:
            return fn()
        except retryable_exceptions as exc:  # type: ignore[misc]
            last_exc = exc
            if attempt >= max_retries:
                break
            # Apply ±10% jitter to avoid thundering herd
            # Generates a value in [-0.1 * delay, +0.1 * delay]
            jitter = delay * 0.1 * (2 * (hash(str(exc)) % 10) / 10 - 1)
            sleep_time = min(delay + jitter, max_delay)
            logger.warning(
                "retry attempt %d/%d after %.2fs (error: %s)",
                attempt + 1,
                max_retries,
                sleep_time,
                exc,
            )
            time.sleep(sleep_time)
            delay = min(delay * backoff, max_delay)

    raise RetryExhausted(last_exc or Exception("unknown"), attempts=max_retries + 1)


def is_retryable(exc: Exception, retryable_types: Optional[tuple] = None) -> bool:
    """Return True if *exc* should trigger a retry."""
    if retryable_types is None:
        return True
    return isinstance(exc, retryable_types)


class RetryPolicy:
    """Configurable retry policy object."""

    def __init__(
        self,
        max_retries: int = DEFAULT_MAX_RETRIES,
        base_delay: float = DEFAULT_BASE_DELAY,
        max_delay: float = DEFAULT_MAX_DELAY,
        backoff: float = DEFAULT_BACKOFF,
        retryable_exceptions: Optional[Type[Exception]] = None,
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.backoff = backoff
        self.retryable_exceptions = retryable_exceptions

    def execute(self, fn: Callable[[], Any]) -> Any:
        exc_tuple = (self.retryable_exceptions,) if self.retryable_exceptions else None
        return retry(
            fn,
            max_retries=self.max_retries,
            base_delay=self.base_delay,
            max_delay=self.max_delay,
            backoff=self.backoff,
            retryable_exceptions=exc_tuple,
        )
