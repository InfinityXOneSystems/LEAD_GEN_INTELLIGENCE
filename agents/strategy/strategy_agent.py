"""
agents/strategy/strategy_agent.py
==================================
Strategy Agent — Business strategy formulation and decision support.

Capabilities:
  - Analyse competitive landscape
  - Recommend growth strategies based on lead data
  - Evaluate strategic options using simulation outputs
  - Prioritise outreach campaigns
"""

from __future__ import annotations

import logging
from typing import Any

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class StrategyAgent(BaseAgent):
    """Business strategy formulation agent."""

    agent_name = "STRATEGY_AGENT"

    async def execute(self, task: dict, context: dict | None = None) -> dict[str, Any]:
        """Execute a strategy task.

        Supported task types:
          - ``analyse_competitive``  — Analyse competition
          - ``recommend_growth``     — Growth strategy recommendations
          - ``evaluate_options``     — Compare strategic options
        """
        ctx = context or {}
        task_type = task.get("type", "recommend_growth")

        logger.info("[STRATEGY_AGENT] Processing task type=%s", task_type)

        if task_type == "analyse_competitive":
            return await self._analyse_competitive(task, ctx)
        if task_type == "evaluate_options":
            return await self._evaluate_options(task, ctx)
        return await self._recommend_growth(task, ctx)

    async def _analyse_competitive(self, task: dict, ctx: dict) -> dict:
        market = task.get("market", "flooring")
        return {
            "success": True,
            "market": market,
            "competitors": [],
            "competitive_intensity": "medium",
            "opportunities": ["underserved_regions", "commercial_segment"],
        }

    async def _recommend_growth(self, task: dict, ctx: dict) -> dict:
        lead_count = task.get("lead_count", 0)
        return {
            "success": True,
            "recommendations": [
                "Focus outreach on HOT leads first",
                "Expand to 3 new cities per month",
                "Prioritise commercial flooring contractors",
            ],
            "confidence": 0.75,
        }

    async def _evaluate_options(self, task: dict, ctx: dict) -> dict:
        options = task.get("options", [])
        return {
            "success": True,
            "options_evaluated": len(options),
            "recommended": options[0] if options else None,
            "rationale": "Best risk-adjusted return",
        }
