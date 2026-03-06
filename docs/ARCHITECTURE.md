# Technical Architecture — XPS Lead Intelligence Platform

> **Last updated:** _auto-updated by evolve_docs.js_

---

## Technology Stack

### Backend (Node.js)

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Crawlee | ^3.x | Web crawling framework |
| Playwright | ^1.x | Browser automation |
| Express | ^5.x | GPT Actions API server |
| PostgreSQL (`pg`) | ^8.x | Primary database |
| SQLite3 | ^5.x | Local/fallback database |
| BullMQ / node-cron | ^4.x | Task queue / scheduling |
| Nodemailer | ^8.x | Email delivery |
| Axios | ^1.x | HTTP client |
| Cheerio | ^1.x | HTML parsing |
| OpenAI | ^6.x | AI enrichment (optional) |

### Frontend / Dashboard

| Technology | Purpose |
|---|---|
| Next.js 16 | React framework with static export |
| Tailwind CSS | Utility-first CSS |
| TypeScript | Type safety |
| PWA (SW + Manifest) | Offline support, installability |

### CI/CD

| Technology | Purpose |
|---|---|
| GitHub Actions | Workflow automation |
| GitHub Pages | Static dashboard hosting |
| GitHub CLI (`gh`) | Issue creation from workflows |

---

## Current State vs. Target State

### Current State (Phase 6 Complete)

```
✅ Lead scoring engine        agents/scoring/
✅ Scraper framework          scrapers/
✅ Outreach engine            outreach/
✅ PostgreSQL schema          db/
✅ Next.js dashboard          dashboard/
✅ Static HTML dashboard      pages/
✅ GPT Actions server         agents/gpt_actions/
✅ Orchestrator               agents/orchestrator/
✅ National discovery         .github/workflows/national_discovery.yml
✅ GitHub Actions pipelines   .github/workflows/
✅ PWA support                dashboard/public/, pages/
✅ Unit tests                 tests/
```

### Target State (Phase 7–8)

```
🔲 Redis task queue integration        (BullMQ wiring)
🔲 Real email delivery (Nodemailer)    (currently simulated)
🔲 LinkedIn enrichment                 (agents/email/)
🔲 Full PostgreSQL production setup    (db/ + cloud hosting)
🔲 Nationwide auto-discovery           (automated pipeline)
🔲 Live self-review + issue creation   (.github/workflows/docs_reflection.yml)
🔲 AI-powered lead analysis            (OpenAI integration)
🔲 Multi-tenant support                (per-client campaigns)
```

---

## Database Schema

```sql
-- PostgreSQL schema (db/schema.sql)
CREATE TABLE IF NOT EXISTS leads (
  id          SERIAL PRIMARY KEY,
  company     TEXT NOT NULL,
  phone       TEXT NOT NULL DEFAULT '',
  website     TEXT NOT NULL DEFAULT '',
  email       TEXT,
  address     TEXT,
  city        TEXT NOT NULL DEFAULT '',
  state       TEXT NOT NULL DEFAULT '',
  rating      NUMERIC(3,1),
  reviews     INTEGER,
  category    TEXT,
  score       INTEGER,
  tier        TEXT,
  source      TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_history ( ... );
CREATE TABLE IF NOT EXISTS outreach_log ( ... );
CREATE TABLE IF NOT EXISTS lead_scores ( ... );
```

---

## Lead Scoring Model

```
Score = completeness (40) + quality (30) + industry (20) + geo (10)

Completeness sub-score:
  +10  website present
  +10  phone present
  +15  email discovered
  +5   address complete

Quality sub-score:
  +10  rating > 4.0
  +5   reviews > 10
  +15  website reachable

Industry sub-score:
  +20  category matches target industries

Geo sub-score:
  +10  city/state present

Tiers:
  HOT   ≥ 75
  WARM  50–74
  COLD  < 50
```

---

## Deployment Architecture

### GitHub Pages (Static Dashboard)

```
Repository main branch
       │
       ▼
GitHub Actions: build dashboard
       │
       ▼
dashboard/out/ → gh-pages branch
       │
       ▼
https://infinityxonesystems.github.io/LEAD_GEN_INTELLIGENCE/
```

### Backend (Self-hosted / Cloud)

```
GitHub Actions (cron)
       │
       ▼
Node.js scraper workers
       │
       ▼
PostgreSQL (Supabase / Railway / self-hosted)
       │
       ▼
REST API (agents/gpt_actions/server.js)
       │
       ▼
Dashboard data files (data/leads/*.json)
```

---

## Security Architecture

See [SECURITY.md](./SECURITY.md) for full threat model.

Key controls:
- Secrets managed via GitHub Actions secrets (never committed)
- Database SSL enforced by default (`rejectUnauthorized: true`)
- API server uses Express with input validation
- Scraper respects `robots.txt` and rate limits

---

## Performance Targets

| Metric | Target |
|---|---|
| Scraper throughput | 100 leads/minute |
| Scoring pipeline | <5s for 10,000 leads |
| Dashboard load | <2s TTI |
| Outreach queue | 500 emails/hour |
| Database upsert | 100 records/batch |

---

_See also: [BLUEPRINT.md](./BLUEPRINT.md) · [SECURITY.md](./SECURITY.md) · [OPERATIONS.md](./OPERATIONS.md)_
