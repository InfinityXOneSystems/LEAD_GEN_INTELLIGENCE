# Railway Deployment Guide — XPS Intelligence System

## Overview

This guide covers deploying the XPS Intelligence System backend to [Railway](https://railway.app), including:

- **API Gateway** (Node.js / Express)
- **Background Worker** (Python task queue)
- **AWS RDS PostgreSQL** database connection
- **Groq LLM** integration
- **Redis** async task queue
- **Qdrant** vector database

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY PLATFORM                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  API Gateway │  │   Worker     │  │   Scheduler  │     │
│  │  (Node.js)   │  │  (Python)    │  │  (Node Cron) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
├────────────────────────────┼────────────────────────────────┤
│                            ▼                                │
│          ┌─────────────────────────────┐                   │
│          │   EXTERNAL SERVICES         │                   │
│          ├─────────────────────────────┤                   │
│          │ • AWS RDS PostgreSQL        │                   │
│          │ • Redis Queue               │                   │
│          │ • Groq LLM API              │                   │
│          │ • Qdrant Vector DB          │                   │
│          │ • GitHub API                │                   │
│          └─────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Setup

### 1. Connect GitHub Repository

1. Log in to [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `InfinityXOneSystems/XPS_INTELLIGENCE_SYSTEM`
4. Railway will auto-detect the `Procfile` and start deploying

### 2. Configure Services

Railway reads `railway.json` to define services:

| Service | Type | Entry Point |
|---------|------|-------------|
| `api-gateway` | Node.js | `node api/gateway.js` |
| `worker` | Python | `python -m task_queue.worker` |

Build commands are run automatically:
- Node.js: `npm install`
- Python: `pip install -r requirements.txt`

### 3. Set Environment Variables

In the Railway dashboard, go to **Project Settings → Variables** and add the variables from `.env.railway.template`.

#### Required Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | AWS RDS PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `GROQ_API_KEY` | Groq LLM API key |
| `GROQ_MODEL` | Groq model name (e.g. `llama3-8b-8192`) |
| `NODE_ENV` | Set to `production` |
| `PORT` | Server port (Railway sets this automatically) |

#### Optional Variables

| Variable | Description |
|----------|-------------|
| `QDRANT_URL` | Qdrant vector database URL |
| `QDRANT_API_KEY` | Qdrant API key |
| `OLLAMA_BASE_URL` | Ollama local LLM base URL |
| `OPENAI_API_KEY` | OpenAI fallback API key |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `GITHUB_TOKEN` | GitHub API token for workflow automation |

---

## AWS RDS PostgreSQL Configuration

### Create an RDS Instance

1. Go to [AWS RDS Console](https://console.aws.amazon.com/rds)
2. Click **Create database** → **PostgreSQL**
3. Choose **Free tier** or your preferred instance class
4. Set the database name to `xps_db`
5. Note the endpoint, username, and password

### Security Group

Make sure the RDS security group allows inbound connections from Railway's IP range, or set it to `0.0.0.0/0` for testing (restrict in production).

### Connection String Format

```
postgresql://username:password@your-rds-endpoint.amazonaws.com:5432/xps_db
```

Set this as the `DATABASE_URL` environment variable in Railway.

### Run Migrations

After deployment, trigger the migration via the Railway CLI or dashboard:

```bash
railway run npm run db:migrate
```

---

## Groq LLM Integration

The LLM router automatically selects Groq when `LLM_PROVIDER=groq` and `GROQ_API_KEY` is set.

### Groq Setup

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Set `GROQ_API_KEY` in Railway variables
4. Set `GROQ_MODEL` to one of:
   - `llama3-8b-8192` (fast, recommended)
   - `llama3-70b-8192` (more capable)
   - `mixtral-8x7b-32768` (large context)

### Fallback Order

If Groq is unavailable, the router falls back in this order:
1. Groq (`GROQ_API_KEY`)
2. Ollama (`OLLAMA_BASE_URL`)
3. OpenAI (`OPENAI_API_KEY`)

---

## Redis Setup

### Option A: Railway Redis Plugin

1. In your Railway project, click **New** → **Database** → **Redis**
2. Railway automatically sets `REDIS_URL` in your service environment

### Option B: External Redis

Set `REDIS_URL` manually:

```
redis://:password@your-redis-endpoint:6379/0
```

---

## Build & Deployment Process

### Automatic Deployment

Every push to the connected branch triggers:

1. `npm install` (Node.js dependencies)
2. `pip install -r requirements.txt` (Python dependencies)
3. Start `web` process: `node api/gateway.js`
4. Start `worker` process: `python -m task_queue.worker`

### Manual Deployment

Using the Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### npm Scripts (Railway-specific)

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node api/gateway.js` | Start the API gateway |
| `npm run start:worker` | `python -m task_queue.worker` | Start the background worker |
| `npm run db:migrate` | `knex migrate:latest` | Run database migrations |

---

## Health Checks & Monitoring

### Health Check Endpoint

The API gateway exposes a health check at:

```
GET /health
```

Configure Railway to use this endpoint:

1. Go to **Service Settings** → **Networking**
2. Set **Health Check Path** to `/health`

> **Note:** Railway automatically injects the `PORT` environment variable into your service. You do not need to set `PORT` manually in Railway's variable settings — it is provided at runtime and the API gateway reads it via `process.env.PORT`.

### Logs

View real-time logs in the Railway dashboard under **Deployments → Logs**.

Alternatively, use the CLI:

```bash
railway logs
```

### Monitoring

Set `SENTRY_DSN` to enable Sentry error tracking, or `DATADOG_API_KEY` for Datadog metrics.

---

## Troubleshooting

### Build Failures

**Node.js build fails:**
- Ensure `node_modules/` is listed in `.railwayignore`
- Check that `package.json` has all required dependencies

**Python build fails:**
- Verify `requirements.txt` is up to date
- Check for version conflicts with `pip install --dry-run -r requirements.txt`

### Database Connection Errors

- Confirm `DATABASE_URL` is set correctly
- Check RDS security group allows Railway's egress IPs
- Test the connection: `railway run node -e "require('pg').Pool({ connectionString: process.env.DATABASE_URL }).query('SELECT 1').then(console.log)"`

### Worker Not Processing Tasks

- Confirm `REDIS_URL` is set and Redis is reachable
- Check worker logs for errors: `railway logs --service worker`
- Restart the worker: scale it down to 0 and back up in Railway dashboard

### LLM Errors

- Verify `GROQ_API_KEY` is valid at [console.groq.com](https://console.groq.com)
- Check `GROQ_MODEL` is a valid model name
- If Groq is rate-limited, set `LLM_PROVIDER=openai` and provide `OPENAI_API_KEY`

---

## Scaling Workers

To handle higher load, scale the worker process in Railway:

1. Go to **Service Settings** → **Scaling**
2. Increase the number of worker replicas

Or use the CLI:

```bash
railway scale worker=3
```

---

## Environment Isolation

Use Railway environments for separate configs:

| Environment | Branch | Purpose |
|-------------|--------|---------|
| `production` | `main` | Live traffic |
| `staging` | `develop` | Pre-release testing |
| `development` | feature branches | Development |

Each environment gets its own set of variables and its own database.

---

## Security Notes

- Never commit `.env` or `.env.local` files — they are listed in `.railwayignore`
- Rotate API keys regularly
- Use Railway's encrypted variable storage for all secrets
- Restrict RDS security groups to Railway's IP ranges in production
- Set `CORS_ALLOWED_ORIGINS` to your exact frontend domain(s)

---

## Related Files

| File | Purpose |
|------|---------|
| `Procfile` | Process definitions for Railway |
| `railway.json` | Railway service configuration |
| `.railwayignore` | Files excluded from Railway builds |
| `.env.railway.template` | Environment variables reference |
| `api/gateway.js` | API gateway entry point |
| `task_queue/worker.py` | Background worker entry point |
| `requirements.txt` | Python dependencies |
| `package.json` | Node.js dependencies and scripts |
| `knexfile.js` | Database migration configuration |
