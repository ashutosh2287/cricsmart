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

## ML win probability (Phase 2 scaffold)

- Offline ML workspace: `/ml`
- Inference service: `ml/inference/main.py` (`POST /predict/win-probability`)
- App debug endpoint: `/api/debug/ml`

Runtime flags:

- `WIN_PROBABILITY_MODE` (`legacy` | `ml_local`, default `legacy`)
- `WIN_PROBABILITY_DEBOUNCE_MS` (default `120`)

## Production environment variables

- `REDIS_URL` – Redis connection string used by server routes/services.
- `CRICKET_API_KEY` – Server-side API key used for live CricAPI scorecard ingestion.
- `NEXT_PUBLIC_BASE_URL` – Public frontend URL for client calls.
- `NEXT_PUBLIC_ERROR_ENDPOINT` – Optional monitoring endpoint for client crash reports.
- `LOG_LEVEL` – Structured logger minimum level (`debug`, `info`, `warn`, `error`).

## Authentication and authorization

Auth is cookie-based with server-side Redis sessions.

### Roles

- `public` (unauthenticated): read-only match viewing endpoints/pages.
- `operator` / `admin`: simulation + match control endpoints.
- `internal` (and `admin`): debug/diagnostics endpoints.

### Rollout

Use phased rollout with:

- `AUTH_ENABLED` (boolean)
- `AUTH_ROLLOUT_PHASE` (`1` to `4`)
  - Phase 1: auth endpoints + login UI
  - Phase 2: protect internal/debug routes
  - Phase 3: protect admin mutation routes
  - Phase 4: optional SSE enforcement (with `AUTH_ENFORCE_SSE=true`)

### Core auth env vars

- `AUTH_COOKIE_NAME` (default `cricsmart_session`)
- `AUTH_SESSION_TTL_SECONDS` (default `28800`)
- `AUTH_SESSION_ROTATE_SECONDS` (default `1800`)
- `AUTH_RATE_LIMIT_WINDOW_SECONDS` (default `60`)
- `AUTH_RATE_LIMIT_MAX_ATTEMPTS` (default `6`)
- `AUTH_ALLOW_DEV_BYPASS` (non-production only)
- Bootstrap credentials:
  - `AUTH_BOOTSTRAP_ADMIN_USERNAME` / `AUTH_BOOTSTRAP_ADMIN_PASSWORD`
  - `AUTH_BOOTSTRAP_OPERATOR_USERNAME` / `AUTH_BOOTSTRAP_OPERATOR_PASSWORD`
  - `AUTH_BOOTSTRAP_INTERNAL_USERNAME` / `AUTH_BOOTSTRAP_INTERNAL_PASSWORD`

### Protected route matrix

- Public:
  - `GET /api/live/fixtures`
  - `GET /api/matches`
  - `GET /api/match/[matchId]`
  - `GET /api/realtime/[matchId]` (only if SSE enforcement disabled)
- Admin/operator:
  - `POST /api/create-match`
  - `POST /api/match`
  - `POST /api/match/init`
  - `POST /api/match/stop`
  - `POST /api/start-simulation`
  - `POST /api/set-speed`
  - `POST /api/simulation/*`
  - `DELETE /api/matches/delete`
  - `POST|DELETE /api/events`
- Internal/admin:
  - `GET /api/debug/*`
  - `GET /api/live/runtime-check`

### Incident playbook (auth)

- Rotate session secret/cookie policy env values.
- Invalidate active sessions by deleting keys with prefix `auth:session:*` in Redis.
- Rotate bootstrap credentials and redeploy.

## Start a live match (runbook)

1. Confirm prerequisites:
   - Install and run app:
     ```bash
     npm ci
     npm run dev
     ```
   - Ensure Redis is reachable via `REDIS_URL`.
   - Set `CRICKET_API_KEY` in `.env.local`.

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
   - Validate `CRICKET_API_KEY` is set in server env:
     ```bash
     printenv CRICKET_API_KEY
     ```
   - Run production runtime check endpoint (safe key mask + live provider counts):
     ```bash
     curl "https://<your-domain>/api/live/runtime-check"
     ```
   - Validate key against CricAPI:
     ```bash
     curl "https://api.cricapi.com/v1/currentMatches?apikey=$CRICKET_API_KEY&offset=0"
     ```
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
