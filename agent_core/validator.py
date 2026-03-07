"""
validator.py – Pydantic schemas and validation helpers.

All data flowing through the PLAN → VALIDATE → EXECUTE pipeline must
pass the validation gates defined here before any tool is invoked.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, field_validator, model_validator


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------


class Command(BaseModel):
    """Validated natural-language command parsed from user input."""

    task: str
    industry: str
    location: str

    @field_validator("task")
    @classmethod
    def task_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("task must not be empty")
        return v

    @field_validator("industry")
    @classmethod
    def industry_not_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("industry must not be empty")
        return v.lower()

    @field_validator("location")
    @classmethod
    def location_valid(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("location must not be empty")
        # Accept "city state", "city, state", or just "state"
        if not re.match(r"^[a-zA-Z ,]+$", v):
            raise ValueError("location must contain only letters, spaces, and commas")
        return v.lower()


class PlanStep(BaseModel):
    """A single step in an agent execution plan."""

    tool: str
    description: str
    params: Optional[Dict[str, Any]] = None


class Plan(BaseModel):
    """Structured execution plan produced by the planner."""

    command: Command
    steps: List[PlanStep]

    @model_validator(mode="after")
    def steps_not_empty(self) -> "Plan":
        if not self.steps:
            raise ValueError("plan must contain at least one step")
        return self


class ExecutionResult(BaseModel):
    """Result returned after executing a plan."""

    success: bool
    leads_found: int = 0
    high_value: int = 0
    message: str = ""
    errors: List[str] = []
    retried: bool = False


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def validate_command(raw: Dict[str, Any]) -> Command:
    """Parse and validate a raw command dict, raising ValueError on failure."""
    return Command(**raw)


def validate_plan(plan: Plan, allowed_tools: List[str]) -> List[str]:
    """
    Validate every step tool against the allowed-tools list.

    Returns a list of violation messages (empty list means valid).
    """
    violations: List[str] = []
    for i, step in enumerate(plan.steps):
        if step.tool not in allowed_tools:
            violations.append(
                f"step[{i}] uses disallowed tool '{step.tool}' "
                f"(allowed: {allowed_tools})"
            )
    return violations


def validate_result(result: ExecutionResult, min_leads: int = 5) -> bool:
    """Return True if the result meets minimum quality thresholds."""
    return result.success and result.leads_found >= min_leads
