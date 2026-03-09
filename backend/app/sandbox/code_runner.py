"""
app/sandbox/code_runner.py
===========================
Safe Python code execution with stdout/stderr capture and timeout enforcement.

Agents that need to evaluate dynamic expressions use this module rather than
calling exec/eval directly, so that output is captured and timeouts apply.
"""

import io
import logging
import threading
from contextlib import redirect_stderr, redirect_stdout
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)

_DEFAULT_TIMEOUT = 30  # seconds


class CodeRunnerError(Exception):
    """Raised when code execution fails or times out."""


def run_code(
    code: str,
    globals_: Optional[Dict[str, Any]] = None,
    locals_: Optional[Dict[str, Any]] = None,
    timeout: int = _DEFAULT_TIMEOUT,
) -> Tuple[str, str, Optional[Exception]]:
    """
    Execute *code* in a restricted namespace with captured output.

    :param code: Python source to execute (exec).
    :param globals_: Optional globals dict. Defaults to a minimal safe namespace.
    :param locals_: Optional locals dict.
    :param timeout: Seconds before execution is interrupted.
    :returns: (stdout, stderr, exception_or_None)

    .. warning::
        This does NOT provide OS-level isolation. Use only for trusted,
        pre-validated code snippets. For arbitrary user code, use a
        subprocess or container-level sandbox.
    """
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    exc_holder: list = [None]
    result_locals: Dict[str, Any] = locals_ if locals_ is not None else {}

    safe_globals: Dict[str, Any] = {
        "__builtins__": {
            "print": print,
            "len": len,
            "range": range,
            "str": str,
            "int": int,
            "float": float,
            "bool": bool,
            "list": list,
            "dict": dict,
            "set": set,
            "tuple": tuple,
            "enumerate": enumerate,
            "zip": zip,
            "sorted": sorted,
            "min": min,
            "max": max,
            "sum": sum,
            "abs": abs,
            "round": round,
        }
    }
    if globals_:
        safe_globals.update(globals_)

    def _exec() -> None:
        try:
            with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
                exec(code, safe_globals, result_locals)  # noqa: S102
        except Exception as exc:
            exc_holder[0] = exc

    thread = threading.Thread(target=_exec, daemon=True)
    thread.start()
    thread.join(timeout=timeout)

    if thread.is_alive():
        logger.error("code execution timed out after %ds", timeout)
        # Cannot kill the thread; flag as timed out
        return (
            stdout_buf.getvalue(),
            stderr_buf.getvalue(),
            CodeRunnerError("Execution timed out"),
        )

    return stdout_buf.getvalue(), stderr_buf.getvalue(), exc_holder[0]
