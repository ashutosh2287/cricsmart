# CricSmart

Real-time cricket simulation with live analytics, commentary, replay, and SSE-driven match updates.

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

## Validation

```bash
npm run lint
npm run build
```

## Production environment variables

- `REDIS_URL` – Redis connection string used by server routes/services.
- `CRICKET_API_KEY` – Server-side API key used for live CricAPI scorecard ingestion.
- `NEXT_PUBLIC_BASE_URL` – Public frontend URL for client calls.
- `NEXT_PUBLIC_ERROR_ENDPOINT` – Optional monitoring endpoint for client crash reports.
- `LOG_LEVEL` – Structured logger minimum level (`debug`, `info`, `warn`, `error`).

## Deployment scaffolding

- **Vercel (frontend):** `vercel.json`
- **Railway / VPS (backend process):** `railway.json` + `Procfile`

Both use:
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm run start`

## Live simulation and replay checks

For final production validation, verify in browser with React DevTools Profiler:

1. Live simulation normal speed and ultra-fast speed.
2. No full-page rerender per ball.
3. Analytics panels/charts rerender only when relevant data changes.
4. Commentary feed rerender isolation.
5. Replay scrubbing, over seeking, and wicket replay during active live simulation.
6. Reconnect during simulation (no duplicate commentary, no stale snapshot, no dropped score updates).
