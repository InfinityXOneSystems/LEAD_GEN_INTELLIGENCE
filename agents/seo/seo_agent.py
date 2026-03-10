"""
agents/seo/seo_agent.py
========================
SEO Agent – analyses websites and extracts SEO signals for lead scoring.

Capabilities:
  - Page title, meta description, headings extraction
  - Structured data (JSON-LD, schema.org) parsing
  - Contact information extraction (phone, email, address)
  - Business category detection
  - Page load status and reachability check
  - Social media profile link detection

Usage::

    agent = SEOAgent()
    result = await agent.execute({"command": "analyse https://example.com"})
    result = await agent.run("analyse https://example.com flooring")
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import urllib.parse
from typing import Any

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

# Allow SSL verification to be disabled via environment variable (e.g. for
# scraping sites with self-signed certs in dev). Defaults to verifying SSL.
_VERIFY_SSL = os.getenv("SEO_AGENT_VERIFY_SSL", "true").lower() not in ("0", "false", "no")


class SEOAgent(BaseAgent):
    """
    SEO analysis agent.

    Extracts business and contact intelligence from web pages to
    enrich and score contractor leads.
    """

    agent_name = "seo_agent"
    max_retries = 2
    retry_delay = 1.0

    # ------------------------------------------------------------------
    # Capability declaration
    # ------------------------------------------------------------------

    def capabilities(self) -> list[str]:
        return [
            "page_analysis",
            "meta_extraction",
            "contact_extraction",
            "structured_data",
            "social_link_detection",
            "reachability_check",
        ]

    # ------------------------------------------------------------------
    # Main execution
    # ------------------------------------------------------------------

    async def execute(
        self,
        task: dict[str, Any],
        context: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Analyse a URL or command for SEO signals.

        Task payload keys:
          url     – target URL to analyse (optional; extracted from command)
          command – natural language command with optional URL
          keyword – industry keyword for relevance scoring

        :returns: SEO analysis result dict.
        """
        command = task.get("command", "")
        url = task.get("url") or _extract_url(command)
        keyword = task.get("keyword", "")

        if not url:
            return {
                "success": False,
                "error": "No URL provided or extractable from command",
                "agent": self.agent_name,
            }

        logger.info("[SEOAgent] Analysing URL: %s", url)
        self.emit_event("seo.start", {"url": url, "keyword": keyword})

        try:
            analysis = await _analyse_url(url, keyword)
            self.emit_event("seo.complete", {"url": url, "score": analysis.get("seo_score")})
            return {
                "success": True,
                "url": url,
                "analysis": analysis,
                "agent": self.agent_name,
            }
        except Exception as exc:
            logger.error("[SEOAgent] Analysis failed for %s: %s", url, exc)
            self.emit_event("seo.error", {"url": url, "error": str(exc)})
            return {
                "success": False,
                "url": url,
                "error": str(exc),
                "agent": self.agent_name,
            }


# ---------------------------------------------------------------------------
# Analysis helpers
# ---------------------------------------------------------------------------


def _extract_url(text: str) -> str:
    """Extract the first URL from *text*."""
    match = re.search(r"https?://[^\s]+", text)
    if match:
        url = match.group(0).rstrip(".,;)")
        return url
    # Try extracting bare domain
    match = re.search(r"\b([a-zA-Z0-9-]+\.[a-z]{2,})\b", text)
    if match:
        return f"https://{match.group(1)}"
    return ""


async def _analyse_url(url: str, keyword: str = "") -> dict[str, Any]:
    """Fetch and analyse *url* for SEO signals."""
    try:
        import aiohttp  # type: ignore
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=15),
            headers={"User-Agent": "Mozilla/5.0 (compatible; XPSBot/1.0)"},
        ) as session:
            async with session.get(url, ssl=_VERIFY_SSL, allow_redirects=True) as resp:
                status = resp.status
                content_type = resp.headers.get("content-type", "")
                if "html" not in content_type:
                    return _minimal_analysis(url, status, reachable=True)
                html = await resp.text(errors="replace")
    except Exception as exc:
        logger.warning("[SEOAgent] Failed to fetch %s: %s", url, exc)
        return _minimal_analysis(url, 0, reachable=False, error=str(exc))

    return _parse_html(html, url, status, keyword)


def _minimal_analysis(
    url: str,
    status: int,
    reachable: bool,
    error: str = "",
) -> dict[str, Any]:
    return {
        "url": url,
        "reachable": reachable,
        "status_code": status,
        "error": error,
        "title": "",
        "description": "",
        "phones": [],
        "emails": [],
        "social_links": [],
        "structured_data": [],
        "seo_score": 15 if reachable else 0,
    }


def _parse_html(html: str, url: str, status: int, keyword: str) -> dict[str, Any]:
    """Extract SEO signals from raw HTML."""
    title = re.search(r"<title[^>]*>([^<]+)</title>", html, re.I)
    description = re.search(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']',
        html,
        re.I,
    )
    h1s = re.findall(r"<h1[^>]*>([^<]+)</h1>", html, re.I)

    phones = _extract_phones(html)
    emails = _extract_emails(html)
    social_links = _extract_social_links(html)
    structured_data = _extract_structured_data(html)

    # Compute a simple SEO score
    score = 0
    if title:
        score += 10
    if description:
        score += 10
    if h1s:
        score += 5
    if phones:
        score += 15
    if emails:
        score += 20
    if social_links:
        score += 10
    if structured_data:
        score += 10
    if keyword and keyword.lower() in html.lower():
        score += 20

    return {
        "url": url,
        "reachable": True,
        "status_code": status,
        "title": title.group(1).strip() if title else "",
        "description": description.group(1).strip() if description else "",
        "h1": [h.strip() for h in h1s[:3]],
        "phones": phones[:5],
        "emails": emails[:5],
        "social_links": social_links,
        "structured_data": structured_data[:3],
        "keyword_present": bool(keyword and keyword.lower() in html.lower()),
        "seo_score": min(100, score),
    }


def _extract_phones(html: str) -> list[str]:
    phones = re.findall(
        r"(?:(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})",
        html,
    )
    return list(dict.fromkeys(p.strip() for p in phones))


def _extract_emails(html: str) -> list[str]:
    emails = re.findall(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", html)
    filtered = [
        e for e in emails
        if not any(skip in e.lower() for skip in ["example", "domain", "test", "yourdomain"])
    ]
    return list(dict.fromkeys(filtered))


def _extract_social_links(html: str) -> list[str]:
    platforms = ["facebook.com", "twitter.com", "instagram.com", "linkedin.com", "youtube.com"]
    links = []
    for platform in platforms:
        matches = re.findall(rf'href=["\']([^"\']*{re.escape(platform)}[^"\']*)["\']', html, re.I)
        links.extend(matches[:1])  # One per platform
    return links


def _extract_structured_data(html: str) -> list[dict]:
    """Extract JSON-LD structured data."""
    scripts = re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.I | re.S,
    )
    results = []
    for script in scripts:
        try:
            import json
            data = json.loads(script.strip())
            results.append(data)
        except Exception:
            pass
    return results
