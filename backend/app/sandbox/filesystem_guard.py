"""
app/sandbox/filesystem_guard.py
================================
Restricts filesystem access to a designated safe directory.
"""

import logging
import os
import tempfile
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

_SAFE_ROOT: Optional[Path] = None


def get_safe_root() -> Path:
    """Return (and create if needed) the sandbox-safe working directory."""
    global _SAFE_ROOT
    if _SAFE_ROOT is None:
        base = os.environ.get("SANDBOX_ROOT", tempfile.gettempdir())
        _SAFE_ROOT = Path(base) / "xps_sandbox"
        _SAFE_ROOT.mkdir(parents=True, exist_ok=True)
    return _SAFE_ROOT


def safe_path(relative: str) -> Path:
    """
    Resolve *relative* inside the safe root and raise if it escapes.

    :raises PermissionError: If the resolved path is outside the safe root.
    """
    root = get_safe_root()
    resolved = (root / relative).resolve()
    if not str(resolved).startswith(str(root.resolve())):
        raise PermissionError(
            f"Path traversal detected: '{relative}' resolves outside sandbox root"
        )
    return resolved


def is_safe(path: str) -> bool:
    """Return True if *path* is within the sandbox root."""
    try:
        safe_path(path)
        return True
    except (PermissionError, ValueError):
        return False


def sandbox_temp_dir(prefix: str = "task_") -> Path:
    """Create and return a temporary directory inside the sandbox root."""
    root = get_safe_root()
    tmp = Path(tempfile.mkdtemp(prefix=prefix, dir=str(root)))
    return tmp
