"""
agents/ceo/ceo_agent.py
=======================
CEO Agent — Top-level strategic orchestrator for the XPS Intelligence platform.

The CEO Agent:
  - Sets high-level objectives for all other agents
  - Prioritises tasks based on business impact
  - Coordinates Vision, Research, Strategy, and Validation agents
  - Reviews agent outputs and approves/rejects decisions
  - Escalates critical findings to human operators
"""

from __future__ import annotations

import logging
from typing import Any

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class CEOAgent(BaseAgent):
    """Top-level autonomous strategic agent."""

    agent_name = "CEO_AGENT"

    # Agents this CEO coordinates
    SUBORDINATE_AGENTS = [
        "VISION_AGENT",
        "RESEARCH_AGENT",
        "PREDICTION_AGENT",
        "SIMULATION_AGENT",
        "STRATEGY_AGENT",
        "VALIDATION_AGENT",
        "CODING_AGENT",
        "DOCUMENTATION_AGENT",
    ]

    async def execute(self, task: dict, context: dict | None = None) -> dict[str, Any]:
        """Execute a CEO-level strategic task.

        Supported task types:
          - ``set_objective``   — Define a new strategic objective
          - ``review_output``   — Review output from a subordinate agent
          - ``prioritise``      — Reprioritise the task queue
          - ``status``          — Report platform-wide status
        """
        ctx = context or {}
        task_type = task.get("type", "status")

        logger.info("[CEO_AGENT] Processing task type=%s", task_type)

        if task_type == "set_objective":
            return await self._set_objective(task, ctx)
        if task_type == "review_output":
            return await self._review_output(task, ctx)
        if task_type == "prioritise":
            return await self._prioritise(task, ctx)
        return await self._status(ctx)

    # ------------------------------------------------------------------
    async def _set_objective(self, task: dict, ctx: dict) -> dict:
        objective = task.get("objective", "")
        priority = task.get("priority", "medium")
        assign_to = task.get("assign_to", self.SUBORDINATE_AGENTS[0])

        logger.info("[CEO_AGENT] Setting objective: '%s' → %s (priority=%s)",
                    objective, assign_to, priority)

        self._emit_event("objective_set", {
            "objective": objective,
            "assigned_to": assign_to,
            "priority": priority,
        })

        return {
            "success": True,
            "objective": objective,
            "assigned_to": assign_to,
            "priority": priority,
            "message": f"Objective assigned to {assign_to}",
        }

    async def _review_output(self, task: dict, ctx: dict) -> dict:
        agent = task.get("agent", "unknown")
        output = task.get("output", {})
        verdict = "approved"  # Default; extend with LLM review logic

        logger.info("[CEO_AGENT] Reviewing output from %s — verdict: %s", agent, verdict)

        return {
            "success": True,
            "agent": agent,
            "verdict": verdict,
            "notes": "Output reviewed by CEO_AGENT",
        }

    async def _prioritise(self, task: dict, ctx: dict) -> dict:
        tasks = task.get("tasks", [])
        # Simple priority sort: sort by "priority" field descending
        priority_map = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        sorted_tasks = sorted(
            tasks,
            key=lambda t: priority_map.get(t.get("priority", "low"), 1),
            reverse=True,
        )
        return {"success": True, "prioritised_tasks": sorted_tasks}

    async def _status(self, ctx: dict) -> dict:
        return {
            "success": True,
            "agent": self.agent_name,
            "subordinates": self.SUBORDINATE_AGENTS,
            "status": "operational",
        }

    def _emit_event(self, event_type: str, data: dict) -> None:
        from agents.base_agent import emit
        emit({"type": event_type, "source": self.agent_name, **data})
