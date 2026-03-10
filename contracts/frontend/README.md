# Frontend Integration Contract

## What is this?

This directory contains ready-to-use TypeScript components and services that wire the
[XPS-INTELLIGENCE-FRONTEND](https://github.com/InfinityXOneSystems/XPS-INTELLIGENCE-FRONTEND)
app to the XPS backend runtime API.

## Files

| File | Target location in frontend repo | Purpose |
|------|-----------------------------------|---------|
| `src/services/runtimeService.ts` | `src/services/runtimeService.ts` | Typed API client for runtime endpoints |
| `src/components/RuntimeCommandChat.tsx` | `src/components/RuntimeCommandChat.tsx` | Chat UI with live task polling |

## Installation Steps

### 1. Copy the files

```bash
# From the XPS-INTELLIGENCE-FRONTEND repo root:
curl -o src/services/runtimeService.ts \
  https://raw.githubusercontent.com/InfinityXOneSystems/XPS_INTELLIGENCE_SYSTEM/main/contracts/frontend/src/services/runtimeService.ts

curl -o src/components/RuntimeCommandChat.tsx \
  https://raw.githubusercontent.com/InfinityXOneSystems/XPS_INTELLIGENCE_SYSTEM/main/contracts/frontend/src/components/RuntimeCommandChat.tsx
```

### 2. Set the environment variable

In your Vercel project settings (or `.env.local`):

```bash
VITE_API_URL=https://your-railway-backend.up.railway.app
```

### 3. Wire into a page

The simplest way: replace the mock `AIChatPanel` in `AgentPage.tsx` with `RuntimeCommandChat`:

```tsx
// src/pages/AgentPage.tsx  (or wherever the chat lives)
import { RuntimeCommandChat } from '@/components/RuntimeCommandChat'

// Inside your JSX:
<div className="h-[calc(100vh-8rem)]">
  <RuntimeCommandChat />
</div>
```

Or add it to the `DashboardPage.tsx`:

```tsx
import { RuntimeCommandChat } from '@/components/RuntimeCommandChat'

// Inside a grid column:
<div className="col-span-2 h-[600px]">
  <RuntimeCommandChat />
</div>
```

### 4. Verify the integration

1. Open the frontend in your browser
2. Type: `scrape epoxy contractors in Tampa FL`
3. You should see:
   - ✅ A success toast: "Queued: Web Scrape"
   - ✅ An assistant message showing the task ID
   - ✅ A task status panel that polls every 1.5 seconds
   - ✅ Status progresses: `QUEUED → RUNNING → COMPLETED`
   - ✅ Logs and result appear when complete

## API Contract

See `DEPLOYMENT.md` in the root of `XPS_INTELLIGENCE_SYSTEM` for the full API contract
documentation including request/response schemas.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | ✅ Yes | Full URL to Railway backend, e.g. `https://xps-api.up.railway.app` |

> **Note**: The existing `VITE_API_URL` in `chatService.ts` defaults to `http://localhost:3000/api`.
> The new `runtimeService.ts` uses `http://localhost:8000` as default (the FastAPI backend port).
> Set `VITE_API_URL` to your Railway URL in production to make both work correctly.
