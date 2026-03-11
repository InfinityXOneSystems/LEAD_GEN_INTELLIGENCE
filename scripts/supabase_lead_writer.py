#!/usr/bin/env python3
"""
scripts/supabase_lead_writer.py
================================
Supabase PostgREST Lead Writer

Routes ALL scraped leads to:
  1. Supabase (via PostgREST REST API) — primary storage
  2. InfinityXOneSystems/LEADS GitHub repo — JSON archive

This module REPLACES the PostgreSQL db/leadStore.js path for all
pipeline writes. The backend database (Railway) is no longer used
for lead storage.

Environment variables (set in Vercel and CI):
  NEXT_PUBLIC_SUPABASE_URL     — https://nxfbfbipjsfzoefpgrof.supabase.co
  SUPABASE_SERVICE_ROLE_KEY    — service role key (bypasses RLS for writes)
  GITHUB_TOKEN                 — push leads JSON to InfinityXOneSystems/LEADS

Usage:
  python scripts/supabase_lead_writer.py --input leads/leads.json
  # or import:
  from scripts.supabase_lead_writer import write_leads_to_supabase
"""

from __future__ import annotations

import argparse
import base64 as b64
import json
import logging
import os
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.error import HTTPError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)
log = logging.getLogger("supabase_lead_writer")

# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
LEADS_TABLE = "leads"  # Supabase table name

# GitHub LEADS repo (leads archive)
LEADS_REPO = "InfinityXOneSystems/LEADS"
GITHUB_API = "https://api.github.com"


# ─────────────────────────────────────────────────────────────────────────────
# Supabase REST helpers
# ─────────────────────────────────────────────────────────────────────────────


def _supabase_headers(prefer: str = "resolution=merge-duplicates") -> dict:
    """Build headers for Supabase PostgREST requests."""
    if not SUPABASE_URL:
        raise EnvironmentError(
            "NEXT_PUBLIC_SUPABASE_URL is not set. "
            "Add it to your environment, .env.local, or Vercel project settings."
        )
    if not SUPABASE_SERVICE_KEY:
        raise EnvironmentError(
            "SUPABASE_SERVICE_ROLE_KEY is not set. "
            "Add it to your environment or Vercel project settings."
        )
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": prefer,
    }


def _http_post(url: str, payload: Any, headers: dict) -> dict:
    """POST JSON payload to URL, return parsed response."""
    data = json.dumps(payload).encode("utf-8")
    req = Request(url, data=data, headers=headers, method="POST")
    try:
        with urlopen(req, timeout=30) as resp:
            body = resp.read()
            return {"status": resp.status, "body": json.loads(body) if body else {}}
    except HTTPError as exc:
        body = exc.read()
        log.warning("HTTP %d: %s", exc.code, body[:200])
        return {"status": exc.code, "body": body.decode("utf-8", errors="replace")[:200]}


def _normalise_lead(lead: dict) -> dict:
    """Map arbitrary scraper output to the canonical Supabase leads schema."""
    return {
        "company_name": (lead.get("company_name") or lead.get("company") or "").strip(),
        "contact_name": lead.get("contact_name") or lead.get("contact") or None,
        "phone": lead.get("phone") or None,
        "email": lead.get("email") or None,
        "website": lead.get("website") or None,
        "address": lead.get("address") or None,
        "city": (lead.get("city") or "").strip(),
        "state": (lead.get("state") or "").strip(),
        "country": lead.get("country") or "US",
        "industry": lead.get("industry") or lead.get("category") or None,
        "rating": lead.get("rating") or None,
        "reviews": lead.get("reviews") or None,
        "lead_score": lead.get("lead_score") or lead.get("score") or 0,
        "source": lead.get("source") or "pipeline",
    }


def write_leads_to_supabase(
    leads: List[dict],
    batch_size: int = 100,
) -> Dict[str, Any]:
    """
    Upsert leads into Supabase via PostgREST.

    Uses conflict resolution on (company_name, city) — set by Supabase
    unique constraint. Batches to avoid payload limits.

    Returns summary dict with success/failure counts.
    """
    if not leads:
        log.info("No leads to write to Supabase.")
        return {"success": 0, "failed": 0, "total": 0}

    url = f"{SUPABASE_URL}/rest/v1/{LEADS_TABLE}"
    headers = _supabase_headers("resolution=merge-duplicates,return=minimal")

    normalised = [_normalise_lead(l) for l in leads]
    # Drop rows with empty company_name (invalid)
    valid = [r for r in normalised if r["company_name"]]

    success_count = 0
    failed_count = 0

    for i in range(0, len(valid), batch_size):
        batch = valid[i : i + batch_size]
        result = _http_post(url, batch, headers)
        if result["status"] in (200, 201, 204):
            success_count += len(batch)
            log.info("Supabase batch %d/%d: ✅ %d leads written",
                     i // batch_size + 1, (len(valid) - 1) // batch_size + 1, len(batch))
        else:
            failed_count += len(batch)
            log.error("Supabase batch %d/%d: ❌ HTTP %d — %s",
                      i // batch_size + 1, (len(valid) - 1) // batch_size + 1,
                      result["status"], str(result["body"])[:200])

    log.info("Supabase write complete: %d success, %d failed (of %d total)",
             success_count, failed_count, len(valid))
    return {"success": success_count, "failed": failed_count, "total": len(valid)}


# ─────────────────────────────────────────────────────────────────────────────
# GitHub LEADS repo push
# ─────────────────────────────────────────────────────────────────────────────


def push_leads_to_github_repo(
    leads: List[dict],
    date_slug: str,
    github_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Push leads JSON to InfinityXOneSystems/LEADS repo.

    Writes two files:
      leads/leads_{date_slug}.json  — timestamped snapshot
      leads/latest.json             — always the latest batch
    """
    token = github_token or os.environ.get("GITHUB_TOKEN", "")
    if not token:
        log.warning("GITHUB_TOKEN not set — skipping LEADS repo push")
        return {"success": False, "reason": "GITHUB_TOKEN not set"}

    base = f"{GITHUB_API}/repos/{LEADS_REPO}/contents"
    auth_headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
    }

    files = {
        f"leads/leads_{date_slug}.json": json.dumps(leads, indent=2),
        "leads/latest.json": json.dumps(leads, indent=2),
    }

    pushed = 0
    for path_in_repo, content in files.items():
        encoded = b64.b64encode(content.encode()).decode()
        # Get existing sha if file exists
        sha = None
        get_req = Request(f"{base}/{path_in_repo}", headers=auth_headers)
        try:
            with urlopen(get_req, timeout=10) as r:
                sha = json.loads(r.read())["sha"]
        except HTTPError:
            pass  # File doesn't exist yet

        payload: dict = {
            "message": f"chore(leads): autonomous pipeline update {date_slug}",
            "content": encoded,
        }
        if sha:
            payload["sha"] = sha

        result = _http_post(f"{base}/{path_in_repo}", payload, auth_headers)
        if result["status"] in (200, 201):
            log.info("✅ Pushed %s to LEADS repo", path_in_repo)
            pushed += 1
        else:
            log.error("❌ Failed to push %s: HTTP %d", path_in_repo, result["status"])

    return {"success": pushed == len(files), "files_pushed": pushed}


# ─────────────────────────────────────────────────────────────────────────────
# Full write pipeline
# ─────────────────────────────────────────────────────────────────────────────


def write_leads(
    leads: List[dict],
    date_slug: Optional[str] = None,
    skip_supabase: bool = False,
    skip_github: bool = False,
) -> Dict[str, Any]:
    """
    Write leads to all configured sinks (Supabase + LEADS repo).

    Args:
        leads:          list of lead dicts from scraper/pipeline
        date_slug:      date string for file naming (default: today)
        skip_supabase:  skip Supabase write (useful in dry-run)
        skip_github:    skip LEADS repo push (useful in dry-run)

    Returns:
        dict with results from each sink
    """
    if not date_slug:
        date_slug = time.strftime("%Y-%m-%d")

    results: dict = {"leads_count": len(leads), "date": date_slug}

    if not skip_supabase:
        results["supabase"] = write_leads_to_supabase(leads)
    else:
        results["supabase"] = {"skipped": True}

    if not skip_github:
        results["github_leads"] = push_leads_to_github_repo(leads, date_slug)
    else:
        results["github_leads"] = {"skipped": True}

    return results


# ─────────────────────────────────────────────────────────────────────────────
# CLI
# ─────────────────────────────────────────────────────────────────────────────


def _cli(argv: Optional[list] = None) -> int:
    p = argparse.ArgumentParser(
        description="Write scraped leads to Supabase and LEADS repo"
    )
    p.add_argument("--input", required=True, help="Path to leads JSON file")
    p.add_argument("--date", default=None, help="Date slug for file naming")
    p.add_argument("--dry-run", action="store_true", help="Validate only, no writes")
    args = p.parse_args(argv)

    leads_path = Path(args.input)
    if not leads_path.exists():
        log.error("Input file not found: %s", leads_path)
        return 1

    leads = json.loads(leads_path.read_text(encoding="utf-8"))
    log.info("Loaded %d leads from %s", len(leads), leads_path)

    result = write_leads(
        leads,
        date_slug=args.date,
        skip_supabase=args.dry_run,
        skip_github=args.dry_run,
    )
    print(json.dumps(result, indent=2))
    return 0 if result.get("supabase", {}).get("failed", 0) == 0 else 1


if __name__ == "__main__":
    sys.exit(_cli())
