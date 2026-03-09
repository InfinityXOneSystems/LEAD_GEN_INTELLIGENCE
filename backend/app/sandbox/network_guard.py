"""
app/sandbox/network_guard.py
=============================
Network access policy for sandboxed agents.

Maintains a block-list of domains/IPs that agents must not contact.
For full network isolation, a process-level approach (namespaces/iptables)
would be needed; this module provides a best-effort application-layer guard.
"""

import logging
import re
from typing import Optional, Set

logger = logging.getLogger(__name__)

# Domains that are never allowed in sandbox context
_BLOCKED_DOMAINS: Set[str] = {
    "169.254.169.254",  # AWS metadata endpoint
    "metadata.google.internal",
    "metadata.internal",
}

_ALLOW_LIST_ENABLED = False
_ALLOWED_DOMAINS: Set[str] = set()


def block_domain(domain: str) -> None:
    """Add a domain to the block-list."""
    _BLOCKED_DOMAINS.add(domain.lower().strip())


def allow_domain(domain: str) -> None:
    """Add a domain to the explicit allow-list."""
    _ALLOWED_DOMAINS.add(domain.lower().strip())


def enable_allow_list(enabled: bool = True) -> None:
    """When enabled, only domains in the allow-list are permitted."""
    global _ALLOW_LIST_ENABLED
    _ALLOW_LIST_ENABLED = enabled


def _extract_host(url: str) -> Optional[str]:
    """Extract the hostname from a URL string."""
    match = re.match(r"^(?:https?://)?([^/:?#]+)", url.lower())
    return match.group(1) if match else None


def is_allowed(url: str) -> bool:
    """
    Return True if *url* is permitted under current network policy.

    Checks:
    1. Block-list (always enforced)
    2. Allow-list (only when enabled)
    """
    host = _extract_host(url)
    if host is None:
        return True  # Non-URL strings pass through

    if host in _BLOCKED_DOMAINS:
        logger.warning("network_guard: BLOCKED request to '%s'", host)
        return False

    if _ALLOW_LIST_ENABLED and host not in _ALLOWED_DOMAINS:
        logger.warning("network_guard: '%s' not in allow-list — BLOCKED", host)
        return False

    return True


def assert_allowed(url: str) -> None:
    """Raise PermissionError if *url* is blocked."""
    if not is_allowed(url):
        raise PermissionError(f"Network access denied for URL: '{url}'")
