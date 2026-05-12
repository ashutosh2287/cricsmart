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
- `NEXT_PUBLIC_CRICKET_API_KEY` – Optional compatibility fallback key for live polling.
- `NEXT_PUBLIC_BASE_URL` – Public frontend URL for client calls.
- `NEXT_PUBLIC_ERROR_ENDPOINT` – Optional monitoring endpoint for client crash reports.
- `LOG_LEVEL` – Structured logger minimum level (`debug`, `info`, `warn`, `error`).

## Start a live match (runbook)

1. Confirm prerequisites:
   - Install and run app:
     ```bash
     npm ci
     npm run dev
     ```
   - Ensure Redis is reachable via `REDIS_URL`.
   - Set `CRICKET_API_KEY` in `.env.local`.
   - For compatibility, set `NEXT_PUBLIC_CRICKET_API_KEY` to the same value.

2. Pick IDs:
   - `externalMatchId`: valid CricAPI match id.
   - `matchId`: internal CricSmart id used in routes/UI.

3. Start live session (API):
   ```bash
   curl -X POST http://localhost:3000/api/match/init \
     -H "Content-Type: application/json" \
     -d '{
       "matchId":"live-ipl-001",
       "teamA":"Team A",
       "teamB":"Team B",
       "type":"LIVE",
       "externalMatchId":"<cricapi-match-id>"
     }'
   ```
   - Missing `externalMatchId` or missing API key returns `400`.

4. Expected behavior after init:
   - Match is upserted as `LIVE` in registry.
   - Worker starts consuming queue events.
   - Live ingestor starts polling and pushing provider events.
   - Heartbeat fields begin updating (`isLiveConnected`, `heartbeatFresh`, `reconnectHealth`).

5. Verify startup health:
   - Check `/api/matches`: status `LIVE` and `reconnectHealth` becomes `healthy`.
   - Open match UI and confirm score/over/commentary update continuously.
   - Confirm event progression is monotonic (no backward or duplicate events).

6. Operational stability checks:
   - During temporary provider failures, verify disconnect marking + retry/backoff behavior.
   - Ensure match does not remain stale/disconnected while active.
   - Verify scoreboard and commentary stay aligned.

7. Troubleshooting checklist:
   - Check `/api/match/init` response first.
   - Validate API keys (`CRICKET_API_KEY`, compatibility fallback).
   - Validate `externalMatchId`.
   - Validate Redis connectivity.
   - Validate worker and live ingestor are running.

8. Production rollout:
   - Test with one known live match in staging.
   - Validate reconnect behavior and no duplicate commentary/score drift.
   - Then enable for broader traffic.

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
