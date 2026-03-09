"""
app/runtime/command_validator.py
=================================
Validates incoming command payloads against the expected schema.
"""

import re
from typing import Any, Dict, Optional, Tuple

# Allowed command types
ALLOWED_COMMANDS = {
    "scrape_website",
    "scrape_maps",
    "scrape_yelp",
    "scrape_directory",
    "enrich_lead",
    "score_leads",
    "send_outreach",
    "run_seo_audit",
    "run_social_scan",
    "run_browser",
    "run_scraper",
    "export_leads",
    "dedup_leads",
    "health_check",
}

# Commands that require sandbox execution
SANDBOX_REQUIRED = {
    "run_browser",
    "scrape_website",
    "scrape_maps",
    "scrape_yelp",
    "scrape_directory",
    "run_scraper",
}

_TARGET_PATTERN = re.compile(r"^[a-zA-Z0-9._\-/:?=&%+ ]{1,500}$")


class ValidationError(Exception):
    """Raised when a command payload fails validation."""

    def __init__(self, message: str, field: Optional[str] = None):
        super().__init__(message)
        self.field = field


def validate_command(
    command: str,
    target: Optional[str] = None,
    parameters: Optional[Dict[str, Any]] = None,
) -> Tuple[str, Optional[str], Dict[str, Any]]:
    """
    Validate a command request.

    :returns: Normalized (command, target, parameters) tuple.
    :raises ValidationError: If any field is invalid.
    """
    if not command or not isinstance(command, str):
        raise ValidationError(
            "command is required and must be a string", field="command"
        )

    command = command.strip().lower()

    if command not in ALLOWED_COMMANDS:
        allowed = ", ".join(sorted(ALLOWED_COMMANDS))
        raise ValidationError(
            f"Unknown command '{command}'. Allowed: {allowed}", field="command"
        )

    if target is not None:
        if not isinstance(target, str):
            raise ValidationError("target must be a string", field="target")
        target = target.strip()
        if target and not _TARGET_PATTERN.match(target):
            raise ValidationError("target contains invalid characters", field="target")

    if parameters is not None and not isinstance(parameters, dict):
        raise ValidationError("parameters must be an object", field="parameters")

    return command, target or None, parameters or {}


def requires_sandbox(command: str) -> bool:
    """Return True if the command must run inside the sandbox executor."""
    return command in SANDBOX_REQUIRED
