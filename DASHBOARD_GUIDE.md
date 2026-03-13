# XPS Intelligence — Frontend Applications Guide

> **⚠️ IMPORTANT FOR ALL AGENTS:** This repository contains TWO separate frontend applications.  
> Both must be maintained. **Never forget the `frontend/` Vite app.**

---

## Overview — Two Frontends, One Backend

| | `dashboard/` | `frontend/` |
|---|---|---|
| **Framework** | Next.js 16 (static export) | Vite + React 18 + TypeScript |
| **Package name** | `xps-intelligence-dashboard` | `xps-intelligence-frontend` |
| **Purpose** | Full enterprise dashboard — 13 pages | AI control panel — 4-tab command centre |
| **Deploy target** | GitHub Pages (primary) + Vercel | Vercel (primary) |
| **Workflow** | `nextjs.yml` → GitHub Pages, `dashboard_deploy.yml` → Vercel | `frontend_deploy.yml` → Vercel |
| **Vercel secret** | `VERCEL_DASHBOARD_PROJECT_ID` | `VERCEL_PROJECT_ID` |
| **Live URL (Vercel)** | `xps-intelligence-dashboard.vercel.app` | `xps-intelligence.vercel.app` |
| **GitHub Pages** | `https://infinityxonesystems.github.io/XPS_INTELLIGENCE_SYSTEM/` | — |
| **Backend** | `https://xps-intelligence.up.railway.app` | `https://xps-intelligence.up.railway.app` |
| **Local dev** | `cd dashboard && npm run dev` → `http://localhost:3001` | `cd frontend && npm run dev` → `http://localhost:5173` |

Both frontends connect to the **same Railway backend** (Express gateway at `api/gateway.js`).

---

## 1. `dashboard/` — Full Enterprise Dashboard (Next.js)

### Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `pages/index.js` | Home — navigation grid of all modules |
| `/chat` | `pages/chat.js` | **Autonomous AI Agent** — full 3-panel Manus-style layout; parallel task slots; shadow scraper activity |
| `/leads` | `pages/leads.js` | **Lead Viewer** — search, filter, paginate, export CSV; loads from API + static JSON fallback |
| `/crm` | `pages/crm.js` | Enterprise CRM — pipeline, outreach, follow-up, contacts |
| `/analytics` | `pages/analytics.js` | Lead analytics, pipeline charts, system health |
| `/intelligence` | `pages/intelligence.js` | Vision Cortex — AI intelligence scraper, daily briefings, market opportunities |
| `/invention-lab` | `pages/invention-lab.js` | Idea generation, hypothesis testing, experiment engine |
| `/trends` | `pages/trends.js` | Live trend discovery, niche scanner, competitive intelligence |
| `/guardian` | `pages/guardian.js` | System Guardian — real-time health, anomaly detection, auto-repair |
| `/workspace` | `pages/workspace.js` | Live browser, code editor, UI generation |
| `/studio` | `pages/studio.js` | AI image/video creator, business templates |
| `/connectors` | `pages/connectors.js` | GitHub, Google Workspace, Vercel, Docker MCP |
| `/settings` | `pages/settings.js` | LLM, APIs, scraping, outreach configuration |

### Components

- `components/RuntimeCommandChat.js` — Autonomous LLM chat with tool-call visualisation, parallel worker slots, shadow scraper activity feed

### Static Data (GitHub Pages)

The dashboard bundles static JSON in `public/data/` for offline / GitHub Pages serving:
- `public/data/scored_leads.json` — **auto-synced from `leads/scored_leads.json`** at build time
- `public/data/scoring_report.json` — lead scoring summary
- `public/data/analytics.json` — pre-computed analytics
- `public/data/guardian.json` — system guardian data
- `public/data/intelligence.json` — vision cortex data
- `public/data/trends.json` — market trend data

> The `nextjs.yml` workflow copies `leads/scored_leads.json` → `public/data/scored_leads.json` before building so the GitHub Pages deployment always has the latest lead data.

### Local Development

```bash
cd dashboard
cp .env.local.example .env.local   # configure backend URLs
npm install
npm run dev                         # → http://localhost:3001
```

### Build & Deploy

```bash
# GitHub Pages (auto on push to main)
cd dashboard && npm run build       # outputs to dashboard/out/

# Vercel (auto via dashboard_deploy.yml, or manual)
vercel --prod
```

### Environment Variables

| Variable | Local default | Production |
|----------|--------------|------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3099` | `https://xps-intelligence.up.railway.app` |
| `NEXT_PUBLIC_GATEWAY_URL` | `http://localhost:3099` | `https://xps-intelligence.up.railway.app` |
| `NEXT_PUBLIC_BASE_PATH` | *(empty)* | Set by GitHub Pages / Vercel automatically |

---

## 2. `frontend/` — Vite+React Control Panel

### Tabs

| Tab | Component | Description |
|-----|-----------|-------------|
| 💬 Chat Agent | `CommandChat.tsx` | LLM chat with Groq; smart local fallback reads live lead data; renders GFM markdown tables |
| 📋 Leads | `App.tsx → LeadsPanel` | Lead table with search; normalises all 3 gateway response shapes |
| 🤖 Agent Activity | `AgentActivityFeed.tsx` | Live agent task feed |
| 📊 Task Status | `TaskStatusPanel.tsx` | Runtime task monitor |

### Key files

```
frontend/src/
├── App.tsx                    # Root — tabs, status bar, leads panel
│   └── normaliseLeadsResponse()  # handles { success, data: { leads } } gateway format
├── components/
│   ├── CommandChat.tsx        # LLM chat; react-markdown + remark-gfm; SCRAPE_KEYWORDS[]
│   ├── TaskStatusPanel.tsx    # Task status display
│   └── AgentActivityFeed.tsx  # Agent activity feed
└── lib/
    ├── api.ts                 # Axios client (VITE_API_URL)
    └── runtimeClient.ts       # sendChatMessage, sendCommand, pollTaskUntilDone
```

### Local Development

```bash
cd frontend
npm install
npm run dev                    # → http://localhost:5173
# Backend must be running: cd .. && PORT=3099 node api/gateway.js
```

### Build & Deploy

```bash
cd frontend
VITE_API_URL=https://xps-intelligence.up.railway.app npm run build
# Vercel auto-deploys on push to main (see frontend_deploy.yml)
```

### Environment Variables

| Variable | Local default | Production |
|----------|--------------|------------|
| `VITE_API_URL` | `http://localhost:3099` | `https://xps-intelligence.up.railway.app` |
| `VITE_GATEWAY_URL` | `http://localhost:3099` | `https://xps-intelligence.up.railway.app` |

---

## Backend (shared by both frontends)

Both frontends call the same Railway Express gateway:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | System status, lead count |
| `/api/leads` | GET | Lead list (filter: city, state, minScore, limit, offset) |
| `/api/v1/chat` | POST | LLM chat (Groq when key set; smart local fallback otherwise) |
| `/api/v1/runtime/command` | POST | Dispatch a runtime command |
| `/api/v1/runtime/task/:id` | GET | Poll task status |
| `/api/v1/system/health` | GET | Detailed system health |
| `/api/v1/system/metrics` | GET | Pipeline metrics |

**Smart chat fallback** — when `GROQ_API_KEY` is not set, `buildSmartFallbackReply()` in `api/gateway.js` reads live lead data and answers:
- "find/scrape [keyword] in [city]" → markdown table of matching leads
- "how many leads / stats" → tier breakdown + top sources + top cities
- "best markets" → lead volume by state + top HOT leads
- "what can you do / help" → full capabilities list with live count

---

## Data Flow

```
Universal Shadow Scraper (scripts/universal_shadow_scraper.py)
         │  16 sources: YP, Yelp, BBB, Manta, SuperPages, DDG,
         │  Google Maps HTML, Bing Maps, Local.com, ChamberOfCommerce,
         │  Hotfrog, Playwright headless — NO API KEYS
         ▼
leads/scored_leads.json  (1,159+ real leads, primary)
         │
         ├──▶ pages/data/scored_leads.json   (GitHub Pages static)
         ├──▶ dashboard/public/data/scored_leads.json  (synced at build time)
         ├──▶ Railway PostgreSQL              (db/db.js — backend only)
         └──▶ Supabase                        (nxfbfbipjsfzoefpgrof.supabase.co)
                     │
              Express Gateway (api/gateway.js)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  dashboard/ (Next.js)    frontend/ (Vite+React)
  GitHub Pages + Vercel   Vercel
```

---

## Deployment Workflows

| Workflow | Triggers on | Deploys |
|----------|-------------|---------|
| `nextjs.yml` | push to `main` (dashboard/, data/, leads/) | `dashboard/` → GitHub Pages |
| `dashboard_deploy.yml` | push to main/develop/staging (dashboard/, leads/) | `dashboard/` → Vercel |
| `frontend_deploy.yml` | push to main/develop/staging (frontend/) | `frontend/` → Vercel |
| `universal_scraper.yml` | cron 03:00 + 15:00 UTC | Scrapes → updates leads/scored_leads.json |
| `deploy-railway.yml` | push to main | Backend → Railway |

---

## Quick Start Checklist

```bash
# 1. Start backend
PORT=3099 node api/gateway.js

# 2. Start dashboard (Next.js, port 3001)
cd dashboard && npm install && npm run dev

# 3. Start frontend control panel (Vite, port 5173)
cd ../frontend && npm install && npm run dev

# 4. Open both
open http://localhost:3001   # Dashboard — 13 pages
open http://localhost:5173   # Frontend control panel — 4 tabs
```
