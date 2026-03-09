"""
agents/seo/seo_agent.py
=========================
SEO Automation Agent for the XPS Intelligence Platform.

Automates:
  - On-page SEO analysis (meta tags, headings, structured data)
  - Keyword extraction from lead websites
  - Backlink discovery (link scraping)
  - Sitemap generation hints
  - SEO scoring per lead website
  - Competitor keyword gap analysis

Usage::

    from agents.seo.seo_agent import SEOAgent

    agent = SEOAgent()
    result = await agent.run("analyze seo for flooring contractors in ohio")
"""

from __future__ import annotations

import asyncio
import logging
import re
import time
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse

from agents.base_agent import BaseAgent

logger = logging.getLogger("agents.seo")


# ---------------------------------------------------------------------------
# SEO scoring weights
# ---------------------------------------------------------------------------

_SEO_WEIGHTS = {
    "title_present": 10,
    "meta_description": 10,
    "h1_present": 10,
    "canonical_url": 5,
    "structured_data": 15,
    "mobile_viewport": 10,
    "open_graph": 10,
    "keywords_in_title": 15,
    "https": 10,
    "sitemap_found": 5,
}


# ---------------------------------------------------------------------------
# SEO Analyser (lightweight, no external deps required)
# ---------------------------------------------------------------------------


def _extract_tag(html: str, tag: str) -> Optional[str]:
    """Extract first occurrence of <tag>...</tag> content."""
    m = re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", html, re.IGNORECASE | re.DOTALL)
    return m.group(1).strip() if m else None


def _extract_meta(html: str, name: str) -> Optional[str]:
    """Extract <meta name="name" content="..."> or similar."""
    patterns = [
        rf'<meta\s+name="{name}"\s+content="([^"]*)"',
        rf'<meta\s+content="([^"]*)"\s+name="{name}"',
        rf"<meta\s+name='{name}'\s+content='([^']*)'",
    ]
    for p in patterns:
        m = re.search(p, html, re.IGNORECASE)
        if m:
            return m.group(1)
    return None


def _extract_links(html: str, base_url: str) -> List[str]:
    """Extract all href values from anchor tags."""
    hrefs = re.findall(r'<a\s+[^>]*href="([^"#][^"]*)"', html, re.IGNORECASE)
    links = []
    for h in hrefs:
        if h.startswith("http"):
            links.append(h)
        else:
            links.append(urljoin(base_url, h))
    return list(set(links))[:50]  # cap at 50


def _count_headings(html: str, level: int) -> int:
    return len(re.findall(rf"<h{level}[^>]*>", html, re.IGNORECASE))


def _has_structured_data(html: str) -> bool:
    return bool(re.search(r'application/ld\+json', html, re.IGNORECASE))


def _has_open_graph(html: str) -> bool:
    return bool(re.search(r'property="og:', html, re.IGNORECASE))


def _has_viewport(html: str) -> bool:
    return bool(re.search(r'name="viewport"', html, re.IGNORECASE))


_MAX_TITLE_LENGTH = 60
_MAX_META_DESC_LENGTH = 160


def analyse_html(url: str, html: str, keyword: str = "") -> Dict[str, Any]:
    """Run a lightweight SEO analysis on *html* fetched from *url*."""
    title = _extract_tag(html, "title") or ""
    meta_desc = _extract_meta(html, "description") or ""
    h1_count = _count_headings(html, 1)
    h2_count = _count_headings(html, 2)
    canonical = bool(re.search(r'rel="canonical"', html, re.IGNORECASE))
    structured_data = _has_structured_data(html)
    viewport = _has_viewport(html)
    og = _has_open_graph(html)
    https = url.startswith("https://")
    links = _extract_links(html, url)
    internal = [l for l in links if urlparse(l).netloc == urlparse(url).netloc]
    external = [l for l in links if urlparse(l).netloc != urlparse(url).netloc]

    score = 0
    issues: List[str] = []
    suggestions: List[str] = []

    if title:
        score += _SEO_WEIGHTS["title_present"]
        if keyword and keyword.lower() in title.lower():
            score += _SEO_WEIGHTS["keywords_in_title"]
        if len(title) > _MAX_TITLE_LENGTH:
            issues.append(f"Title too long (>{_MAX_TITLE_LENGTH} chars)")
            suggestions.append(f"Shorten title to 50–{_MAX_TITLE_LENGTH} characters")
    else:
        issues.append("Missing <title> tag")
        suggestions.append("Add a descriptive <title> tag with primary keyword")

    if meta_desc:
        score += _SEO_WEIGHTS["meta_description"]
        if len(meta_desc) > _MAX_META_DESC_LENGTH:
            issues.append(f"Meta description too long (>{_MAX_META_DESC_LENGTH} chars)")
    else:
        issues.append("Missing meta description")
        suggestions.append("Add a meta description (120–160 characters)")

    if h1_count == 1:
        score += _SEO_WEIGHTS["h1_present"]
    elif h1_count == 0:
        issues.append("Missing H1 heading")
        suggestions.append("Add exactly one H1 tag containing primary keyword")
    elif h1_count > 1:
        issues.append(f"Multiple H1 headings ({h1_count})")
        suggestions.append("Use only one H1 per page")

    if canonical:
        score += _SEO_WEIGHTS["canonical_url"]
    else:
        suggestions.append("Add canonical URL tag")

    if structured_data:
        score += _SEO_WEIGHTS["structured_data"]
    else:
        suggestions.append("Add JSON-LD structured data (LocalBusiness schema)")

    if viewport:
        score += _SEO_WEIGHTS["mobile_viewport"]
    else:
        issues.append("Missing mobile viewport meta tag")

    if og:
        score += _SEO_WEIGHTS["open_graph"]
    else:
        suggestions.append("Add Open Graph meta tags for social sharing")

    if https:
        score += _SEO_WEIGHTS["https"]
    else:
        issues.append("Site not using HTTPS")
        suggestions.append("Migrate to HTTPS immediately")

    return {
        "url": url,
        "score": min(100, score),
        "title": title,
        "meta_description": meta_desc,
        "h1_count": h1_count,
        "h2_count": h2_count,
        "canonical": canonical,
        "structured_data": structured_data,
        "mobile_ready": viewport,
        "open_graph": og,
        "https": https,
        "internal_links": len(internal),
        "external_links": len(external),
        "issues": issues,
        "suggestions": suggestions,
    }


# ---------------------------------------------------------------------------
# SEO Agent
# ---------------------------------------------------------------------------


class SEOAgent(BaseAgent):
    """Automates SEO analysis and optimisation tasks."""

    agent_name = "seo_agent"

    async def execute(
        self,
        task: Dict[str, Any],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        command = task.get("command", "")
        urls: List[str] = task.get("urls", [])
        keyword: str = task.get("keyword", self._extract_keyword(command))
        mode = task.get("mode", "analyze")  # analyze | audit | keywords | report

        logger.info("SEOAgent: mode=%s keyword=%s urls=%d", mode, keyword, len(urls))

        if mode == "analyze" and urls:
            return await self._analyze_urls(urls, keyword)
        if mode == "audit":
            return await self._run_full_audit(command, keyword)
        if mode == "keywords":
            return self._keyword_report(keyword)
        if mode == "report":
            return await self._generate_report(urls, keyword)

        # Default: analyze any URLs in command or return guidance
        extracted = self._extract_urls(command)
        if extracted:
            return await self._analyze_urls(extracted, keyword)
        return self._keyword_report(keyword)

    # ------------------------------------------------------------------
    # Modes
    # ------------------------------------------------------------------

    async def _analyze_urls(self, urls: List[str], keyword: str) -> Dict[str, Any]:
        """Fetch and analyse each URL."""
        results = []
        for url in urls[:10]:  # cap at 10 per call
            result = await self._analyze_single(url, keyword)
            results.append(result)
            await asyncio.sleep(0.3)  # polite crawl delay

        scores = [r["score"] for r in results]
        avg_score = sum(scores) / len(scores) if scores else 0

        return {
            "success": True,
            "mode": "analyze",
            "keyword": keyword,
            "sites_analyzed": len(results),
            "average_seo_score": round(avg_score, 1),
            "results": results,
        }

    async def _analyze_single(self, url: str, keyword: str) -> Dict[str, Any]:
        """Fetch a single URL and run SEO analysis."""
        try:
            import aiohttp
            async with aiohttp.ClientSession(
                headers={"User-Agent": "XPS-SEO-Agent/1.0"},
                timeout=aiohttp.ClientTimeout(total=10),
            ) as session:
                async with session.get(url, allow_redirects=True) as resp:
                    html = await resp.text(errors="replace")
                    final_url = str(resp.url)
                    return analyse_html(final_url, html, keyword)
        except ImportError:
            # Fallback when aiohttp is not installed
            return {
                "url": url,
                "score": 0,
                "error": "aiohttp not installed; install with: pip install aiohttp",
                "issues": ["Cannot fetch URL"],
                "suggestions": [],
            }
        except Exception as exc:
            return {
                "url": url,
                "score": 0,
                "error": str(exc),
                "issues": ["Failed to fetch URL"],
                "suggestions": [],
            }

    async def _run_full_audit(self, command: str, keyword: str) -> Dict[str, Any]:
        """Full SEO audit: checks leads database for websites."""
        try:
            import json
            import os
            leads_path = os.path.join(
                os.path.dirname(__file__), "..", "..", "leads", "leads.json"
            )
            with open(leads_path) as f:
                leads = json.load(f)
            websites = [
                l.get("website", "") for l in leads
                if l.get("website") and l.get("website").startswith("http")
            ][:20]

            if not websites:
                return {
                    "success": True,
                    "mode": "audit",
                    "message": "No websites found in leads database to audit",
                }

            return await self._analyze_urls(websites, keyword)
        except Exception as exc:
            return {"success": False, "mode": "audit", "error": str(exc)}

    def _keyword_report(self, keyword: str) -> Dict[str, Any]:
        """Return keyword strategy recommendations."""
        long_tail = [
            f"{keyword} near me",
            f"{keyword} contractors",
            f"best {keyword} company",
            f"{keyword} installation cost",
            f"{keyword} services",
            f"local {keyword} experts",
            f"{keyword} free estimate",
            f"professional {keyword}",
        ]
        return {
            "success": True,
            "mode": "keywords",
            "primary_keyword": keyword,
            "long_tail_suggestions": long_tail,
            "content_topics": [
                f"How to choose a {keyword} contractor",
                f"{keyword.title()} installation guide",
                f"Average cost of {keyword} services",
                f"Top questions to ask a {keyword} company",
            ],
            "local_seo_tips": [
                "Claim and optimise Google Business Profile",
                "Add NAP (Name/Address/Phone) schema markup",
                "Build citations in local directories",
                "Get reviews on Google and Yelp",
                "Create location-specific landing pages",
            ],
        }

    async def _generate_report(self, urls: List[str], keyword: str) -> Dict[str, Any]:
        analysis = await self._analyze_urls(urls, keyword) if urls else {}
        keywords = self._keyword_report(keyword)
        return {
            "success": True,
            "mode": "report",
            "summary": {
                "keyword": keyword,
                "urls_audited": len(urls),
                "average_seo_score": analysis.get("average_seo_score", 0),
            },
            "analysis": analysis.get("results", []),
            "keyword_strategy": keywords,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_keyword(command: str) -> str:
        industries = [
            "epoxy", "flooring", "roofing", "concrete", "tile", "carpet",
            "painting", "plumbing", "electrical", "hvac", "construction",
            "remodeling", "landscaping",
        ]
        lower = command.lower()
        for ind in industries:
            if ind in lower:
                return ind
        # Fallback: extract noun-like word after "seo for" or "analyze"
        m = re.search(r"(?:seo|analyze|audit|keywords?)\s+(?:for\s+)?([a-z]+)", lower)
        return m.group(1) if m else "contractor"

    @staticmethod
    def _extract_urls(command: str) -> List[str]:
        return re.findall(r"https?://[^\s]+", command)
