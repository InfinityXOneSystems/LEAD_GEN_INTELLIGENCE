# XPS Intelligence — Webhook Configuration Guide

> **Auto-generated URL reference.** Visit `GET /webhooks/info` on your Railway
> backend to see the live URLs filled in automatically.

---

## Overview

The XPS Intelligence Platform receives events from three external systems via
inbound webhooks. Each webhook is secured with a shared secret and rate-limited
to 60 calls per minute.

```
GitHub ────────────────────► POST /webhooks/github
Supabase (leads table) ─────► POST /webhooks/supabase
Vercel (deployment) ────────► POST /webhooks/vercel
                                        │
                                        ▼
                            Infinity Orchestrator
                            (pipeline trigger / event log)
```

---

## 1. GitHub Webhook

### Endpoint

```
POST https://<RAILWAY_BACKEND_URL>/webhooks/github
```

Replace `<RAILWAY_BACKEND_URL>` with your Railway service URL, e.g.
`https://xpsintelligencesystem-production.up.railway.app`

### Required env var

```
GITHUB_WEBHOOK_SECRET=<your-secret>   # set in Railway + in GitHub
```

Generate a strong secret:
```bash
openssl rand -hex 32
```

### Step-by-step setup (GitHub)

Configure this webhook on **all three** repositories:

| Repository | URL |
|------------|-----|
| `InfinityXOneSystems/XPS_INTELLIGENCE_SYSTEM` | `https://<RAILWAY_BACKEND_URL>/webhooks/github` |
| `InfinityXOneSystems/XPS-INTELLIGENCE-FRONTEND` | `https://<RAILWAY_BACKEND_URL>/webhooks/github` |
| `InfinityXOneSystems/LEADS` | `https://<RAILWAY_BACKEND_URL>/webhooks/github` |

For each repo:

1. Go to **GitHub → Repo → Settings → Webhooks → Add webhook**
2. **Payload URL:** `https://<RAILWAY_BACKEND_URL>/webhooks/github`
3. **Content type:** `application/json`
4. **Secret:** value of `GITHUB_WEBHOOK_SECRET` env var
5. **Which events?** Select *Let me select individual events* and check:
   - ✅ Pushes
   - ✅ Pull requests
   - ✅ Issues
   - ✅ Issue comments
   - ✅ Workflow runs
   - ✅ Repository dispatches
   - ✅ Check runs
   - ✅ Check suites
6. ✅ **Active** — enabled
7. Click **Add webhook**

### Events handled

| Event | Action |
|-------|--------|
| `push` to `main` | Triggers scoring + export pipeline |
| `repository_dispatch` | Runs the named pipeline stage |
| `issue_comment` with `/scrape`, `/score` etc. | Runs that pipeline stage |
| `workflow_run` with `conclusion=failure` | Logs failure, can auto-file issue |

---

## 2. Supabase Database Webhook

### Endpoint

```
POST https://<RAILWAY_BACKEND_URL>/webhooks/supabase
```

### Required env var

```
SUPABASE_WEBHOOK_SECRET=<your-secret>   # set in Railway + in Supabase
```

### Step-by-step setup (Supabase)

1. Go to **Supabase Dashboard → https://nxfbfbipjsfzoefpgrof.supabase.co**
2. Navigate to **Database → Webhooks** (in the left sidebar)
3. Click **Create a new webhook**
4. Fill in:

| Field | Value |
|-------|-------|
| **Name** | `xps-gateway-leads` |
| **Table** | `leads` (schema: `public`) |
| **Events** | ✅ INSERT &nbsp; ✅ UPDATE &nbsp; ✅ DELETE |
| **Type** | HTTP Request |
| **Method** | POST |
| **URL** | `https://<RAILWAY_BACKEND_URL>/webhooks/supabase` |

5. Add HTTP header:

| Header | Value |
|--------|-------|
| `Authorization` | `Bearer <value of SUPABASE_WEBHOOK_SECRET>` |

6. Click **Confirm**

### Events handled

| Event | Action |
|-------|--------|
| `INSERT` on `leads` | Logs new lead, triggers scoring |
| `UPDATE` on `leads` | Logs updated lead score |
| `DELETE` on `leads` | Logs deleted lead |

---

## 3. Vercel Deploy Webhook

### Endpoint

```
POST https://<RAILWAY_BACKEND_URL>/webhooks/vercel
```

### Required env var

```
VERCEL_WEBHOOK_SECRET=<your-secret>   # set in Railway + Vercel will use this
```

> **Note:** Vercel generates its own signing secret at webhook creation time.
> Copy the secret from Vercel and set it as `VERCEL_WEBHOOK_SECRET` in Railway.

### Step-by-step setup (Vercel)

1. Go to **Vercel Dashboard → [Your Team] → Settings → Webhooks**
2. Click **Add webhook**
3. **Endpoint URL:** `https://<RAILWAY_BACKEND_URL>/webhooks/vercel`
4. **Events:** Select:
   - ✅ `deployment.succeeded`
   - ✅ `deployment.error`
   - ✅ `deployment.cancelled`
5. Click **Create**
6. Vercel will show you the **signing secret** — copy it
7. Set `VERCEL_WEBHOOK_SECRET=<signing-secret>` in your Railway environment

### Events handled

| Event | Action |
|-------|--------|
| `deployment.succeeded` | Logs success, forwards to orchestrator |
| `deployment.error` | Logs failure |
| `deployment.cancelled` | Logs cancellation |

---

## 4. Webhook Info Endpoint

You can always check the live webhook configuration by calling:

```bash
curl https://<RAILWAY_BACKEND_URL>/webhooks/info
```

Response includes:
- All three webhook URLs with your Railway base URL pre-filled
- Which secrets are configured (`status.github_secret_configured` etc.)
- Step-by-step instruction arrays for each webhook

---

## 5. Required Environment Variables

Set all of these in **Railway** (backend) environment:

| Variable | Required for | Description |
|----------|-------------|-------------|
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook | HMAC-SHA256 shared secret |
| `SUPABASE_WEBHOOK_SECRET` | Supabase webhook | Bearer token in Authorization header |
| `VERCEL_WEBHOOK_SECRET` | Vercel webhook | SHA1 signing secret |
| `ORCHESTRATOR_URL` | Event forwarding | URL of Infinity Orchestrator (e.g. `http://localhost:3300`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase reads | `https://nxfbfbipjsfzoefpgrof.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase writes | Service role key (already in Vercel + Railway) |

---

## 6. Testing Webhooks Locally

Use [smee.io](https://smee.io) to forward GitHub webhooks to localhost:

```bash
npx smee-client \
  --url https://smee.io/YOUR_CHANNEL \
  --target http://localhost:3000/webhooks/github
```

Then set the smee.io URL as the GitHub webhook Payload URL.

Or test directly:

```bash
# Test GitHub webhook (no secret configured)
curl -X POST http://localhost:3000/webhooks/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -H "X-GitHub-Delivery: test-1" \
  -d '{"ref":"refs/heads/main","repository":{"full_name":"InfinityXOneSystems/XPS_INTELLIGENCE_SYSTEM"}}'

# Test Supabase webhook
curl -X POST http://localhost:3000/webhooks/supabase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret" \
  -d '{"type":"INSERT","table":"leads","record":{"company_name":"Test Co","city":"Miami","state":"FL"}}'

# Get webhook info
curl http://localhost:3000/webhooks/info | python3 -m json.tool
```

---

## 7. Security Checklist

- [ ] `GITHUB_WEBHOOK_SECRET` set in Railway (min 32 hex chars)
- [ ] `SUPABASE_WEBHOOK_SECRET` set in Railway and Supabase
- [ ] `VERCEL_WEBHOOK_SECRET` set in Railway (value from Vercel Dashboard)
- [ ] All three GitHub repos have the webhook configured with HTTPS URL
- [ ] Supabase `leads` table webhook created and Active
- [ ] Vercel team webhook created for `xps-intelligence` project
- [ ] `/webhooks/info` shows `*_secret_configured: true` for all three
