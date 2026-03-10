"""
app/agents/scraper_agent/scraper.py
=====================================
Scraper agent handler for runtime command dispatch.

Delegates to the existing scraper implementations.
"""

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class ScraperAgentHandler:
    """Routes scraping commands to the appropriate scraper module."""

    def execute(
        self,
        task_id: str,
        target: Optional[str],
        parameters: Dict[str, Any],
    ) -> Dict[str, Any]:
        command = parameters.get("_command", "scrape_website")
        query = parameters.get("query") or target or ""
        city = parameters.get("city", "")
        state = parameters.get("state", "")
        max_results = int(parameters.get("max_results", 20))

        logger.info(
            "scraper_agent: command=%s query=%s city=%s task=%s",
            command,
            query,
            city,
            task_id,
        )

        try:
            if command in ("scrape_maps", "scrape_website", "run_scraper"):
                return self._scrape_google_maps(
                    task_id, query, city, state, max_results
                )
            elif command == "scrape_directory":
                return self._scrape_directory(task_id, query, city, state, max_results)
            else:
                return self._scrape_google_maps(
                    task_id, query, city, state, max_results
                )
        except Exception as exc:
            logger.error("scraper_agent failed: %s", exc)
            return {"success": False, "error": str(exc), "task_id": task_id}

    def _scrape_google_maps(
        self, task_id: str, query: str, city: str, state: str, max_results: int
    ) -> Dict[str, Any]:
        from app.scrapers.google_maps import GoogleMapsScraper

        scraper = GoogleMapsScraper()
        results = scraper.scrape(query=query, city=city, state=state)
        return {
            "success": True,
            "count": len(results[:max_results]),
            "results": [
                r.__dict__ if hasattr(r, "__dict__") else r
                for r in results[:max_results]
            ],
            "task_id": task_id,
        }

    def _scrape_directory(
        self, task_id: str, query: str, city: str, state: str, max_results: int
    ) -> Dict[str, Any]:
        from app.scrapers.directory import DirectoryScraper

        scraper = DirectoryScraper()
        results = scraper.scrape(query=query, city=city, state=state)
        return {
            "success": True,
            "count": len(results[:max_results]),
            "results": [
                r.__dict__ if hasattr(r, "__dict__") else r
                for r in results[:max_results]
            ],
            "task_id": task_id,
        }
