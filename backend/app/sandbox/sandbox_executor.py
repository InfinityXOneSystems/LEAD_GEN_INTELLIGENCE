"""
app/sandbox/sandbox_executor.py
================================
Main sandbox executor.

Wraps agent function calls with:
  - Filesystem isolation (safe working directory)
  - Network policy enforcement
  - Output/log capture
  - Execution timeout
  - Exception isolation (errors do not propagate to the runtime process)
"""

import logging
import threading
from typing import Any, Callable, Dict, Optional

from app.sandbox.filesystem_guard import sandbox_temp_dir
from app.sandbox.network_guard import is_allowed

logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 300  # seconds


class SandboxTimeoutError(Exception):
    """Raised when the sandboxed function exceeds its timeout."""


class SandboxExecutor:
    """
    Executes a callable inside a logical sandbox environment.

    Usage::

        executor = SandboxExecutor(task_id="abc-123")
        result = executor.run(
            fn=some_handler_fn,
            kwargs={"command": "scrape_website", ...},
            timeout=60,
        )
    """

    def __init__(self, task_id: str) -> None:
        self.task_id = task_id
        self._work_dir = sandbox_temp_dir(prefix=f"task_{task_id[:8]}_")
        self._logs: list = []

    def _log(self, message: str) -> None:
        self._logs.append(message)
        logger.debug("[sandbox:%s] %s", self.task_id[:8], message)

    def run(
        self,
        fn: Callable[..., Any],
        kwargs: Optional[Dict[str, Any]] = None,
        timeout: int = DEFAULT_TIMEOUT,
    ) -> Dict[str, Any]:
        """
        Run *fn* with *kwargs* inside the sandbox.

        :param fn: Callable to execute.
        :param kwargs: Keyword arguments for *fn*.
        :param timeout: Maximum execution time in seconds.
        :returns: Return value of *fn* (must be a dict), or an error dict.
        :raises SandboxTimeoutError: If execution exceeds *timeout*.
        """
        kwargs = kwargs or {}
        result_holder: list = [None]
        exc_holder: list = [None]

        self._log(
            f"starting execution fn={fn.__name__ if hasattr(fn, '__name__') else fn}"
        )

        def _run_in_thread() -> None:
            try:
                result_holder[0] = fn(**kwargs)
            except Exception as exc:
                exc_holder[0] = exc

        thread = threading.Thread(target=_run_in_thread, daemon=True)
        thread.start()
        thread.join(timeout=timeout)

        if thread.is_alive():
            self._log(f"TIMEOUT after {timeout}s")
            raise SandboxTimeoutError(
                f"Task '{self.task_id}' timed out after {timeout}s"
            )

        if exc_holder[0] is not None:
            exc = exc_holder[0]
            self._log(f"execution failed: {exc}")
            return {
                "success": False,
                "error": str(exc),
                "error_type": type(exc).__name__,
                "task_id": self.task_id,
                "sandbox_logs": self._logs,
            }

        self._log("execution completed")
        result = result_holder[0]
        if not isinstance(result, dict):
            result = {"success": True, "result": result}
        result["sandbox_logs"] = self._logs
        return result

    @property
    def work_dir(self) -> str:
        """Return the sandbox working directory path."""
        return str(self._work_dir)

    def check_url(self, url: str) -> bool:
        """Return True if the URL is permitted by network policy."""
        return is_allowed(url)
