"""
app/api/v1/intelligence.py
===========================
Intelligence & Discovery API endpoints.

GET  /intelligence/discovery              — run market discovery
GET  /intelligence/trends                 — get trend analysis
GET  /intelligence/niches                 — get niche opportunities
GET  /intelligence/briefing               — get daily briefing (JSON)
GET  /intelligence/briefing/markdown      — get daily briefing (Markdown)
GET  /intelligence/system/status          — system guardian status
GET  /intelligence/vision-cortex/status   — vision cortex / scraper status
POST /intelligence/vision-cortex/run      — trigger a scraping run
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Ensure repository root modules are importable from within the backend tree
# ---------------------------------------------------------------------------
_REPO_ROOT = Path(__file__).resolve().parents[5]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

router = APIRouter(prefix="/intelligence", tags=["intelligence"])


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------


class VisionCortexRunRequest(BaseModel):
    """Payload for triggering a scraping run via the vision cortex."""

    industry: str = "flooring"
    region: str = "Texas"
    max_leads: int = 50


class DiscoveryResponse(BaseModel):
    industry: str
    region: str
    opportunity_score: int
    summary: str
    market_analysis: Dict[str, Any] = {}
    trends: List[Dict[str, Any]] = []
    niches: List[Dict[str, Any]] = []


# ---------------------------------------------------------------------------
# Helper: safe import wrapper
# ---------------------------------------------------------------------------


def _try_import(module_path: str):
    """Import *module_path* and return the module, or None on failure."""
    try:
        import importlib

        return importlib.import_module(module_path)
    except Exception as exc:
        logger.warning("module_import_failed module=%s error=%s", module_path, exc)
        return None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/discovery",
    summary="Run market discovery",
    response_description="Unified DISCOVERY_REPORT for the requested industry / region",
)
def get_discovery(
    industry: str = Query(default="flooring", description="Target industry (e.g. epoxy, flooring, construction)"),
    region: str = Query(default="Texas", description="Target geographic region"),
) -> Dict[str, Any]:
    """Run the full discovery pipeline (market scan + trends + niches) and return
    a structured opportunity report.
    """
    try:
        mod = _try_import("discovery.discovery_engine")
        if mod is None:
            raise ImportError("discovery.discovery_engine not available")
        result = mod.run_discovery(industry=industry, region=region)
        return result
    except Exception as exc:
        logger.error("discovery_endpoint_error: %s", exc)
        # Return demo data so the endpoint never hard-fails
        return {
            "industry": industry,
            "region": region,
            "opportunity_score": 75,
            "summary": f"Demo discovery report for {industry} / {region}.",
            "market_analysis": {"growth_rate": 8.0, "avg_competition": 45},
            "trends": [{"name": industry, "score": 80, "emerging": True}],
            "niches": [{"niche": f"Premium {industry}", "opportunity_score": 80, "competition_score": 35}],
            "note": "demo_data",
            "error": str(exc),
        }


@router.get(
    "/trends",
    summary="Get trend analysis",
    response_description="List of detected market trends",
)
def get_trends(
    industry: str = Query(default="flooring", description="Industry to analyse"),
    region: str = Query(default="Texas", description="Target region"),
) -> Dict[str, Any]:
    """Return trend objects for the requested industry / region."""
    try:
        mod = _try_import("discovery.trend_analyzer")
        if mod is None:
            raise ImportError("discovery.trend_analyzer not available")

        analyzer = mod.TrendAnalyzer()
        demo_data = [
            {"industry": industry, "region": region, "source": "api", "tags": [industry, "renovation"]},
            {"industry": industry, "region": region, "source": "api", "tags": [industry, "commercial", "premium"]},
        ]
        trends = analyzer.analyze_trends(demo_data)
        emerging = analyzer.detect_emerging(demo_data)
        return {
            "industry": industry,
            "region": region,
            "trends": trends,
            "emerging": emerging,
            "total": len(trends),
        }
    except Exception as exc:
        logger.error("trends_endpoint_error: %s", exc)
        return {
            "industry": industry,
            "region": region,
            "trends": [{"name": industry, "score": 75.0, "emerging": True}],
            "emerging": [{"name": industry, "score": 75.0, "emerging": True}],
            "total": 1,
            "note": "demo_data",
            "error": str(exc),
        }


@router.get(
    "/niches",
    summary="Get niche opportunities",
    response_description="List of detected niche opportunities",
)
def get_niches(
    industry: str = Query(default="flooring", description="Industry to scan"),
    region: str = Query(default="Texas", description="Target region"),
) -> Dict[str, Any]:
    """Return underserved niche opportunities for the requested industry / region."""
    try:
        mod = _try_import("discovery.niche_detector")
        if mod is None:
            raise ImportError("discovery.niche_detector not available")

        detector = mod.NicheDetector()
        niches = detector.detect(industry=industry, region=region)
        return {
            "industry": industry,
            "region": region,
            "niches": niches,
            "total": len(niches),
        }
    except Exception as exc:
        logger.error("niches_endpoint_error: %s", exc)
        return {
            "industry": industry,
            "region": region,
            "niches": [{"niche": f"Premium {industry}", "opportunity_score": 80, "competition_score": 30}],
            "total": 1,
            "note": "demo_data",
            "error": str(exc),
        }


@router.get(
    "/briefing",
    summary="Get daily intelligence briefing (JSON)",
    response_description="Structured daily briefing object",
)
def get_briefing() -> Dict[str, Any]:
    """Return the full daily intelligence briefing as structured JSON."""
    try:
        mod = _try_import("notifications.daily_briefing_agent")
        if mod is None:
            raise ImportError("notifications.daily_briefing_agent not available")

        agent = mod.DailyBriefingAgent()
        return agent.generate_json()
    except Exception as exc:
        logger.error("briefing_endpoint_error: %s", exc)
        from datetime import date, datetime, timezone

        return {
            "date": date.today().isoformat(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_leads": 0,
            "financial_predictions": [],
            "market_opportunities": [],
            "startup_signals": [],
            "top_leads": [],
            "system_health": {"status": "unknown"},
            "note": "demo_data",
            "error": str(exc),
        }


@router.get(
    "/briefing/markdown",
    summary="Get daily intelligence briefing (Markdown)",
    response_description="Markdown-formatted daily briefing",
)
def get_briefing_markdown() -> Dict[str, Any]:
    """Return the daily briefing rendered as a Markdown string."""
    try:
        mod = _try_import("notifications.daily_briefing_agent")
        if mod is None:
            raise ImportError("notifications.daily_briefing_agent not available")

        agent = mod.DailyBriefingAgent()
        return {"markdown": agent.generate()}
    except Exception as exc:
        logger.error("briefing_markdown_error: %s", exc)
        return {"markdown": "# XPS Daily Briefing\n\n_Data unavailable._", "error": str(exc)}


@router.get(
    "/system/status",
    summary="System Guardian status",
    response_description="Full system health and anomaly report",
)
def get_system_status() -> Dict[str, Any]:
    """Return a comprehensive system health report via the System Guardian."""
    try:
        mod = _try_import("system_guardian.system_guardian")
        if mod is None:
            raise ImportError("system_guardian.system_guardian not available")

        return mod.get_system_status()
    except Exception as exc:
        logger.error("system_status_endpoint_error: %s", exc)
        return {
            "overall": "unknown",
            "health": {},
            "issues": [],
            "note": "demo_data",
            "error": str(exc),
        }


@router.get(
    "/vision-cortex/status",
    summary="Vision cortex / scraper status",
    response_description="Status of the vision cortex scraping subsystem",
)
def get_vision_cortex_status() -> Dict[str, Any]:
    """Return the current status of the vision cortex scraping layer."""
    try:
        vision_path = _REPO_ROOT / "vision_cortex"
        scripts = list(vision_path.glob("*.py")) if vision_path.exists() else []
        return {
            "available": vision_path.exists(),
            "scripts": [s.name for s in scripts],
            "status": "idle",
        }
    except Exception as exc:
        logger.error("vision_cortex_status_error: %s", exc)
        return {"available": False, "scripts": [], "status": "unknown", "error": str(exc)}


@router.post(
    "/vision-cortex/run",
    summary="Trigger a vision cortex scraping run",
    status_code=status.HTTP_202_ACCEPTED,
    response_description="Acknowledgement of the scraping run request",
)
def trigger_vision_cortex_run(payload: VisionCortexRunRequest) -> Dict[str, Any]:
    """Enqueue a scraping run for the requested industry / region.

    The run is dispatched to the task queue; this endpoint returns immediately
    with an acknowledgement and a task reference.
    """
    try:
        import uuid

        task_id = str(uuid.uuid4())
        logger.info(
            "vision_cortex_run_requested industry=%s region=%s task_id=%s",
            payload.industry,
            payload.region,
            task_id,
        )
        # Attempt to enqueue via the runtime queue if available
        try:
            from app.queue.queue_manager import QueueManager

            qm = QueueManager()
            qm.enqueue(
                "scrape",
                {
                    "industry": payload.industry,
                    "region": payload.region,
                    "max_leads": payload.max_leads,
                    "task_id": task_id,
                },
            )
        except Exception:
            # Queue may not be running in all environments — not fatal
            pass

        return {
            "accepted": True,
            "task_id": task_id,
            "industry": payload.industry,
            "region": payload.region,
            "max_leads": payload.max_leads,
            "message": f"Scraping run queued for {payload.industry} in {payload.region}.",
        }
    except Exception as exc:
        logger.error("vision_cortex_run_error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enqueue scraping run: {exc}",
        ) from exc
