# XPS Intelligence – Deployment Guide

## System Architecture

```
XPS-INTELLIGENCE-FRONTEND  (Vercel)        XPS_INTELLIGENCE_SYSTEM  (Railway)
─────────────────────────────────          ──────────────────────────────────
Vite + React + TypeScript                  FastAPI backend
github.com/InfinityXOneSystems/            github.com/InfinityXOneSystems/
  XPS-INTELLIGENCE-FRONTEND                  XPS_INTELLIGENCE_SYSTEM

VITE_API_URL ──────────────────────────► POST /api/v1/runtime/command
                                         GET  /api/v1/runtime/task/{id}
                                         GET  /health
```

| Layer | Repo | Platform | URL |
|-------|------|----------|-----|
| Frontend | XPS-INTELLIGENCE-FRONTEND | Vercel | `https://xps-intelligence.vercel.app` |
| Backend API | XPS_INTELLIGENCE_SYSTEM | Railway | `https://xpsintelligencesystem-production.up.railway.app` |
| Database | Railway PostgreSQL | Railway | internal |
| Queue | Railway Redis | Railway | internal |

---

## Backend – Railway (XPS_INTELLIGENCE_SYSTEM)

### 1. Connect Railway to GitHub

1. Login to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo → `InfinityXOneSystems/XPS_INTELLIGENCE_SYSTEM`
3. Set **Start Command**: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add PostgreSQL + Redis plugins

### 2. Environment Variables (Railway dashboard → Variables)

> **Tip:** See [`VERCEL_DEPLOYMENT_SETUP.md`](VERCEL_DEPLOYMENT_SETUP.md) for the matching Vercel setup steps.

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://default:pass@host:6379` |
| `SECRET_KEY` | JWT signing secret | `openssl rand -hex 32` |
| `SENDGRID_API_KEY` | SendGrid for outreach emails | `SG.xxxx` |
| `OPENAI_API_KEY` | GPT-4 completions | `sk-xxxx` |
| `GITHUB_TOKEN` | Repo access for pipelines | `ghp_xxxx` |
| `PLAYWRIGHT_ENABLED` | Enable browser automation | `false` |
| `CORS_ALLOWED_ORIGINS` | Allowed frontend origins (comma-separated) | `https://xps-intelligence.vercel.app,https://xps-intelligence-*.vercel.app,http://localhost:3000` |
| `FRONTEND_URL` | Vercel frontend base URL | `https://xps-intelligence.vercel.app` |

Copy all values from [`.env.railway.template`](.env.railway.template).

### 3. Verify Backend

```bash
curl https://xpsintelligencesystem-production.up.railway.app/health
# → {"status":"OK","timestamp":"..."}

# Test runtime command endpoint
curl -X POST https://xpsintelligencesystem-production.up.railway.app/api/v1/runtime/command \
  -H "Content-Type: application/json" \
  -d '{"command":"status","priority":5}'
# → {"task_id":"...","status":"queued","command_type":"...","agent":"...","message":"...","params":{}}
```

---

## Frontend – Vercel (XPS-INTELLIGENCE-FRONTEND)

### 1. Connect Vercel to GitHub

1. Login to [vercel.com](https://vercel.com)
2. Add New Project → Import `InfinityXOneSystems/XPS-INTELLIGENCE-FRONTEND`
3. Framework: **Vite** (auto-detected)
4. Root directory: `/` (no change needed)

### 2. Environment Variables (Vercel dashboard → Settings → Environment Variables)

> **Full instructions:** See [`VERCEL_DEPLOYMENT_SETUP.md`](VERCEL_DEPLOYMENT_SETUP.md) for a step-by-step guide including testing commands.

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://xpsintelligencesystem-production.up.railway.app` |
| `VITE_BACKEND_URL` | `https://xpsintelligencesystem-production.up.railway.app` |
| `VITE_API_BASE_URL` | `https://xpsintelligencesystem-production.up.railway.app` |

### 3. Wire the RuntimeCommandChat Component

The `RuntimeCommandChat` component that talks to the backend runtime API is ready to use.
Copy the contract files from this repo:

```bash
# From XPS-INTELLIGENCE-FRONTEND root
cp path/to/XPS_INTELLIGENCE_SYSTEM/contracts/frontend/src/services/runtimeService.ts src/services/
cp path/to/XPS_INTELLIGENCE_SYSTEM/contracts/frontend/src/components/RuntimeCommandChat.tsx src/components/
```

Then add it to `AgentPage.tsx`:

```tsx
import { RuntimeCommandChat } from '@/components/RuntimeCommandChat'

// In your JSX:
<div className="h-[calc(100vh-8rem)]">
  <RuntimeCommandChat />
</div>
```

See `contracts/frontend/README.md` for full integration instructions.

---

## Runtime API Contract

### POST `/api/v1/runtime/command`

**Request:**
```json
{
  "command": "scrape epoxy contractors in Texas",
  "priority": 5,
  "params": {},
  "timeout_seconds": 300
}
```

**Response (202 Accepted):**
```json
{
  "task_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "queued",
  "command_type": "scrape_website",
  "agent": "scraper",
  "message": "Task queued successfully",
  "params": {}
}
```

### GET `/api/v1/runtime/task/{task_id}`

**Response:**
```json
{
  "task_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "completed",
  "command_type": "scrape_website",
  "agent": "scraper",
  "created_at": "2026-03-10T05:00:00Z",
  "started_at": "2026-03-10T05:00:01Z",
  "completed_at": "2026-03-10T05:00:15Z",
  "result": {"leads_scraped": 42},
  "error": null,
  "logs": ["Starting scrape...", "Found 42 leads", "Done."],
  "retries": 0
}
```

**Task status flow:** `pending` → `queued` → `running` → `completed` | `failed` | `retrying`

---

## CI/CD Workflows

| Workflow | Repo | Trigger | Action |
|----------|------|---------|--------|
| `ci.yml` | XPS_INTELLIGENCE_SYSTEM | Push/PR to main | Backend tests + dashboard build |
| `deploy-backend.yml` | XPS_INTELLIGENCE_SYSTEM | Push to main (backend/) | Test + deploy to Railway |
| `system_validation.yml` | XPS_INTELLIGENCE_SYSTEM | Push/PR to any branch | Full system health check |

---

## Docker Compose (Local Dev)

```bash
# From XPS_INTELLIGENCE_SYSTEM root
docker compose up -d
```

| Service | Port | Description |
|---------|------|-------------|
| backend | 8000 | FastAPI backend |
| gateway | 3200 | Express gateway |
| postgres | 5432 | PostgreSQL |
| redis | 6379 | Redis |

> The Vite frontend (XPS-INTELLIGENCE-FRONTEND) runs separately:
> ```bash
> cd ../XPS-INTELLIGENCE-FRONTEND && npm run dev  # port 5173
> ```

---

## Troubleshooting

### Frontend shows "Connection error"
→ `VITE_API_URL` is not set or wrong. Check Vercel env vars.
→ CORS: backend allows all origins by default (`allow_origins=["*"]`).

### Task stays in `queued` forever
→ Worker pool may be at capacity. Check Railway logs.
→ Redis may not be connected. Check `REDIS_URL`.

### Railway deploy fails with "RAILWAY_TOKEN not set"
→ Add `RAILWAY_TOKEN` secret in GitHub repo Settings → Secrets.
→ Get token from Railway dashboard → Account → Tokens.

### Backend 500 on `/api/v1/runtime/command`
→ Check Railway logs: `railway logs`
→ Ensure `DATABASE_URL` and `REDIS_URL` are set.
