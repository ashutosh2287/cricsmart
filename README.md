# CricSmart — Comprehensive Project Dossier

> This README is intentionally written as a **long-form, report-ready source document**. You can paste this file into an AI tool and directly generate:
> - academic project report
> - viva notes
> - project synopsis
> - software engineering documentation
> - final project PPT

---

## 1) Project Overview

**CricSmart** is a full-stack cricket intelligence platform that supports:
- real-time cricket simulation
- hosted/manual match management
- live external fixture ingestion
- replay timeline and commentary intelligence
- analytics visualization and win-probability tracking
- team, tournament, and player profile management
- authentication, authorization, and account-level personalization

The platform is built as a modern web application using Next.js with server routes, Prisma/PostgreSQL persistence, Redis-backed session/security features, and event-driven match updates.

---

## 2) Problem Statement

Cricket platforms often provide either:
1. static scoreboards, or
2. fragmented tools for simulation, analytics, and team management.

CricSmart addresses this gap by combining **simulation + live data + analytics + operations + user ecosystem** in one unified product.

---

## 3) Core Goals and Objectives

1. Build a robust cricket simulation engine with realistic ball-by-ball event progression.
2. Stream real-time updates to clients with low latency and reconnect safety.
3. Offer replay, commentary, and analytical views from event streams.
4. Support hosting use-cases for community matches and tournament workflows.
5. Add role-aware security and route/API access controls.
6. Keep architecture extensible for ML-assisted win probability and commentary intelligence.

---

## 4) Key Functional Domains

### 4.1 Match Experience
- Live match screen with score progression
- Ball-level events and innings state
- Admin control panel for simulation lifecycle
- Hosted match score/control pages

### 4.2 Realtime and Replay
- Server-Sent Events route per runtime match (`/api/realtime/[matchId]`)
- Event broadcast pipeline to keep clients synchronized
- Replay event persistence and timeline reconstruction

### 4.3 Commentary and Intelligence
- Commentary generated from domain ball/wicket events
- Commentary streamed as domain events and added to replay timeline
- Win probability updates emitted as distinct domain events

### 4.4 Analytics
- Charts and analytical selectors derived from replay events
- Momentum, run-rate, over progression, and probability-oriented insights
- Dedicated analytics pages and match-level analytics rendering

### 4.5 Team, Tournament, and Player Ecosystem
- Team creation, squad management, follows/favorites
- Tournament creation and team/match linkage
- Player profile endpoints and discovery pages
- Hosted matches with member roles and save/bookmark behavior

### 4.6 Authentication and Account
- Signup/login/logout/me APIs
- Cookie-based auth session handling
- Account pages for profile, activity, settings, hosted/saved/tournament/teams views
- Middleware-based route gating for authenticated/creator/admin areas

### 4.7 Detailed Feature Explanation (Complete Feature Catalog)

This section expands every major user-facing and system-facing feature so the README can be directly reused as a report source.

#### Feature A — Home Dashboard and Match Discovery
- Shows platform-level overview (live match count, team count, total match count).
- Highlights currently running hosted matches and gives direct entry links.
- Displays live fixtures pulled from provider-backed endpoints.
- Gives fast access to key actions (all matches, create simulation, authentication entry points).
- Business value: creates a single “command center” for users to understand current cricket activity instantly.

#### Feature B — Match Simulation Creation and Control
- Users can create simulation matches by selecting/entering team names.
- The platform generates runtime match IDs and routes users to admin control screens.
- Simulation lifecycle actions include start, pause, resume, stop, speed control, and ball progression.
- Supports both auto-simulation and granular ball-event driven updates.
- Business value: enables training, analytics demos, and tactical scenario experimentation without waiting for real matches.

#### Feature C — Live Match Runtime Screen
- Real-time score, wickets, over/ball progression, and innings state rendering.
- Continuous update stream from server-side event emitters to clients.
- Displays context-aware match status and transitions across innings/endgame states.
- Integrates commentary, probability, and chart modules in one runtime viewing surface.
- Business value: delivers an immersive live-score and intelligence experience similar to production sports platforms.

#### Feature D — Realtime Streaming and Reconnect Reliability
- Uses SSE endpoint (`/api/realtime/[matchId]`) for event delivery to clients.
- Broadcast payloads include typed events (BALL, WICKET, COMMENTARY, probability updates, match finish).
- Client reconnect flow handles temporary disconnects and resumes synchronized state.
- Event meta (sequence, over, ball, timestamps) supports ordering and duplication control.
- Business value: keeps all connected users in near real-time sync with low operational complexity.

#### Feature E — Event-Driven Domain Pipeline
- Match engine emits domain events (BALL, WICKET, MATCH_FINISHED, WIN_PROBABILITY).
- Multiple independent consumers process the same stream:
  - SSE consumer → client broadcasting
  - Replay consumer → timeline storage
  - Commentary consumer → generated commentary events
- Loose coupling allows adding more consumers (alerts, metrics, notifications) without rewriting engine logic.
- Business value: improves extensibility, reliability, and maintainability of core cricket runtime.

#### Feature F — Commentary Intelligence
- Commentary is generated from ball/wicket context through commentary orchestration pipeline.
- Emitted as COMMENTARY domain events, then streamed and stored in timelines.
- Includes tone/importance dimensions useful for richer UX and narrative layers.
- Supports both live fan engagement and replay storytelling.
- Business value: transforms raw scoring events into human-readable cricket narrative.

#### Feature G — Replay Timeline and Event Persistence
- Replay events are appended with sequence-compatible metadata for reconstruction.
- Commentary timeline and ball-event timeline can be replayed after live session.
- Supports review/scrubbing use-cases for analytics, debugging, and educational playback.
- Handles match-finished and probability events as replay records.
- Business value: gives historical introspection beyond “current score only” systems.

#### Feature H — Analytics and Performance Visualization
- Analytics selectors derive chart inputs from replay/event data.
- Supports momentum trends, run-rate progression, over-wise evolution, and probability movement.
- Match and player analytics pages expose data in dedicated analytical interfaces.
- Selector-based architecture keeps analytics calculations reusable and testable.
- Business value: enables tactical insight, storytelling, and post-match analysis.

#### Feature I — Hosted Matches Ecosystem
- Users can create and manage hosted matches with metadata (format, venue, schedule, teams).
- Match-specific actions include toss setup, playing XI management, score updates, and start flow.
- Supports hosted match members with role mapping for collaborative match operations.
- Includes save/bookmark interactions for user-level match tracking.
- Business value: supports local clubs, campus leagues, and community organizers.

#### Feature J — Teams Management
- Team creation with identity metadata (name, short name, slug, visibility, city, logo).
- Squad/member management via dedicated APIs and manage page workflows.
- Social interactions through follow/favorite actions.
- Team ownership model anchored at `Team.ownerId`.
- Business value: builds stable team identities and long-term user engagement around clubs/franchises.

#### Feature K — Tournament Management
- Tournament creation with date range, format, location, and organizer association.
- Team enrollment into tournaments via mapping entities.
- Tournament-to-hosted-match linking for fixtures.
- Membership relation allows role-aware participation at tournament level.
- Business value: supports multi-match competition structures, not just standalone matches.

#### Feature L — Player Profiles and Discovery
- Player profile APIs and pages expose player metadata and stats snapshot fields.
- Discovery pages support browsing player information and profile-level navigation.
- Enables gradual expansion toward scouting/impact analytics.
- Business value: strengthens player-centric features alongside team/match-centric modules.

#### Feature M — Authentication, Session, and Access Control
- Signup/login/logout/me endpoints power account identity lifecycle.
- Password storage is hash-based; auth payloads are schema-validated.
- Session model is cookie-driven with backend session store integration.
- Middleware protects authenticated/creator/admin routes and supports redirect-based guard behavior.
- Business value: secures operational actions (hosting, admin controls, account data).

#### Feature N — Account Personalization
- Account module includes profile, activity, settings, teams, tournaments, hosted matches, saved matches.
- User-specific favorites/saves and participation data are consolidated in account routes.
- Provides “my cricket space” for continuity across sessions.
- Business value: improves retention and user ownership of platform activity.

#### Feature O — Live Fixture Ingestion and Runtime Health
- External fixture endpoints fetch and normalize live cricket data.
- Runtime health/debug endpoints help validate provider and ingestion behavior.
- Supports operational diagnostics for stale feeds, missing updates, and runtime readiness.
- Business value: bridges simulated and real cricket data experiences in one product.

#### Feature P — Debug and Diagnostics Surface
- Dedicated debug APIs for commentary context/runtime/ML and provider/retrieval inspection.
- Runtime-check endpoints support deployment and incident troubleshooting.
- Useful for engineering verification, QA, and demo troubleshooting.
- Business value: reduces mean time to diagnose production-like data-flow issues.

#### Feature Q — ML Workspace and Intelligence Extension
- `/ml` workspace includes data ingestion, feature engineering, training, evaluation, and inference scaffolding.
- Win-probability and commentary intelligence pipelines are versionable and experiment-friendly.
- Feature flags allow gradual runtime adoption of ML-backed paths.
- Business value: future-proofs platform for data science enhancements without destabilizing core runtime.

#### Feature R — Deployment and Environment Flexibility
- Deployment descriptors support both frontend-managed and process-managed hosting styles.
- Environment-driven configuration controls auth rollout, realtime behavior, integrations, and logging.
- Scripted Prisma generation on install/dev/build ensures ORM client consistency.
- Business value: simplifies portability from local development to staging/production targets.

#### Feature S — Security and Operational Safety Controls
- Route policy segmentation (public/authenticated/creator/admin) reduces unauthorized access risk.
- Auth-related rate limiting and strict payload validation reduce abuse surface.
- Session invalidation and centralized middleware policy improve control.
- Reliability design favors fail-closed auth/session behavior in error scenarios.
- Business value: protects user data and operational actions in multi-user environments.

---

## 5) Technology Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Recharts (analytics visualization)
- Framer Motion (UI motion)

### Backend and API Layer
- Next.js Route Handlers
- Node.js server entry (`server/index.ts`)
- Optional Socket.IO bootstrap (attached in custom server)
- SSE pipeline for realtime updates

### Data and Persistence
- PostgreSQL via Prisma ORM
- Redis (sessions, runtime/operational connectivity, rate-limiting support)
- Event/replay timeline persistence services

### Security and Validation
- Zod for payload validation
- bcryptjs for password hashing
- Upstash Redis + ratelimit package for request throttling

### ML Workspace (Offline + Service)
- Python workspace under `/ml`
- Feature engineering, training, evaluation scripts
- FastAPI inference scaffold for win-probability serving

---

## 6) High-Level Architecture

CricSmart follows a layered architecture:

1. **Presentation Layer**
   - Next.js pages/components (`src/app`, `src/components`)
2. **API Layer**
   - Route handlers in `src/app/api/**/route.ts`
3. **Domain/Service Layer**
   - Match engine, simulation services, analytics, commentary, realtime routers (`src/services`)
4. **Domain Event Layer**
   - Event bus + domain consumers for SSE/replay/commentary (`src/domain`)
5. **Persistence Layer**
   - Prisma repositories and schema (`prisma/schema.prisma`, `src/lib`, `src/persistence`)
6. **External Integrations**
   - CricAPI live fixtures, Redis, optional ML inference service

### Event-Driven Flow (Simplified)
1. Match engine emits BALL/WICKET/MATCH_FINISHED/WIN_PROBABILITY events.
2. Consumers react independently:
   - SSE consumer broadcasts payloads to connected clients.
   - Replay consumer appends timeline and replay records.
   - Commentary consumer generates COMMENTARY events from match context.
3. Clients receive updates and refresh score, commentary, and analytics views.

---

## 7) Repository Structure (Important Folders)

- `src/app/` → App Router pages and API routes
- `src/components/` → reusable UI components
- `src/services/` → domain/business logic (engine, analytics, realtime, auth, etc.)
- `src/domain/` → event bus, event definitions, domain consumers
- `src/lib/` → infrastructure helpers and repositories
- `src/persistence/` → event store abstractions and adapters
- `src/types/` → shared TypeScript domain types
- `prisma/` → schema + migrations
- `server/` → custom server bootstrap
- `ml/` → ML data, training, evaluation, inference workspace
- `docs/screenshots/` → project visual assets

---

## 8) Data Model (Prisma) — Entity Summary

Primary entities:
- **User**: identity, credentials, role, profile relation
- **Team**: core team metadata, owner relation, visibility, followers/favorites
- **TeamMember**: membership and role mapping
- **PlayerProfile**: player metadata and snapshot stats
- **HostedMatch**: hosted match metadata, status, toss/batting setup, runtime link
- **HostedMatchMember**: user-role mapping for hosted match
- **Tournament**: organizer-owned tournament metadata
- **TournamentTeam**: team participation mapping
- **TournamentMatch**: hosted match attachment to tournaments
- **TeamFollow/FavoriteTeam/SavedMatch**: account-level social/bookmark features
- **TournamentMember**: user-level tournament participation and role

Enums include:
- `TeamMemberRole`, `TeamVisibility`, `MatchStatus`, `TossDecision`

---

## 9) Route and API Surface

### 9.1 Web Pages (Examples)
- `/` home dashboard
- `/matches`, `/matches/[id]`, `/match/[runtimeMatchId]`
- `/hosted-matches`, `/hosted-matches/[id]`, `/hosted-matches/[id]/control`, `/hosted-matches/[id]/score`
- `/teams`, `/teams/create`, `/teams/[slug]`, `/teams/[slug]/manage`
- `/tournaments`, `/tournaments/create`, `/tournaments/[id]`
- `/players`, `/players/discover`, `/players/profiles/[id]`
- `/analytics`, `/analytics/players`
- `/admin/[matchId]`
- `/login`, `/signup`
- `/account` and nested pages

### 9.2 API Groups (Examples)

**Auth and account**
- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/account/profile`
- `/api/account/password`
- `/api/account/favorites`
- `/api/account/hosted-matches`
- `/api/account/saved-matches`
- `/api/account/tournaments`

**Match simulation/runtime**
- `/api/create-match`
- `/api/start-simulation`
- `/api/set-speed`
- `/api/match`, `/api/match/init`, `/api/match/stop`
- `/api/match/[matchId]`, `/api/match/[matchId]/ball`
- `/api/matches`, `/api/matches/delete`, `/api/matches/[id]/start`
- `/api/simulation/lifecycle|runtime|speed|pause|resume|stop|export`

**Realtime/live/debug**
- `/api/realtime/[matchId]`
- `/api/live/fixtures`
- `/api/live/runtime-check`
- `/api/debug/commentary`
- `/api/debug/commentary-context`
- `/api/debug/commentary-ml`
- `/api/debug/commentary-runtime`
- `/api/debug/providers`
- `/api/debug/retrieval`
- `/api/debug/ml`

**Hosted match and ecosystem**
- `/api/hosted-matches` (+ nested routes for `live`, `[matchId]`, `members`, `playing-xi`, `score`, `start`, `toss`, `save`)
- `/api/teams`, `/api/teams/[slug]` (+ members/follow/favorite/squad routes)
- `/api/tournaments`, `/api/tournaments/[id]` (+ teams/matches)
- `/api/player-profiles`, `/api/player-profiles/[id]`

---

## 10) Authentication and Authorization Model

- Cookie-based session authentication
- Route middleware determines access policy per URL pattern
- Access categories:
  - `public`
  - `authenticated`
  - `creator`
  - `admin`
- Admin role set supports privileged operator paths
- Unauthenticated protected requests redirect to `/login?redirect=...`
- Login route redirects authenticated users to `/account`

---

## 11) Realtime and Simulation Design

1. Match engine mutates match state per ball events.
2. State emission triggers event consumers.
3. SSE consumer pushes typed updates (ball, wicket, match finished, probability, commentary).
4. Replay consumer stores timeline-compatible events.
5. Commentary consumer transforms cricket context into generated text events.
6. Client reconnect logic listens for update continuity and state recovery.

Key outputs preserved by design:
- scoreboard consistency
- commentary continuity
- event sequencing
- replay compatibility

---

## 12) Analytics and Decision Intelligence

Analytics services convert event streams into chart data:
- momentum trend
- over progression
- run rate
- worm/momentum style visual evolution
- win probability movement

These selectors are designed as computation-focused service utilities so UI rendering remains lean and composable.

---

## 13) ML Workspace and Integration Path

The `/ml` workspace supports a separate but connected lifecycle:

### Win Probability Pipeline
1. Dataset ingestion
2. Feature engineering
3. Model training and export
4. Evaluation report generation
5. FastAPI inference endpoint

### Commentary Intelligence Pipeline
1. Commentary dataset building
2. Embedding generation
3. Retrieval index construction
4. Ranker training
5. Inference/evaluation scripts

Runtime feature flags in application:
- `WIN_PROBABILITY_MODE` (`legacy` / `ml_local`)
- `WIN_PROBABILITY_DEBOUNCE_MS`

---

## 14) Environment Configuration

Create `.env.local` from `.env.example` and set values:

- `REDIS_URL`
- `DATABASE_URL`
- `CRICKET_API_KEY`
- `CRICAPI_POLL_INTERVAL_MS`
- `NEXT_PUBLIC_BASE_URL`
- `NEXT_PUBLIC_ERROR_ENDPOINT`
- `LOG_LEVEL`

Auth-related keys:
- `AUTH_ENABLED`
- `AUTH_ROLLOUT_PHASE`
- `AUTH_COOKIE_NAME`
- `AUTH_SESSION_TTL_SECONDS`
- `AUTH_SESSION_ROTATE_SECONDS`
- `AUTH_RATE_LIMIT_WINDOW_SECONDS`
- `AUTH_RATE_LIMIT_MAX_ATTEMPTS`
- `AUTH_ALLOW_DEV_BYPASS`
- `AUTH_ENFORCE_SSE`
- `SOCKET_ALLOWED_ORIGINS`

Optional bootstrap credentials can be set for admin/operator/internal initialization during rollout.

---

## 15) Local Setup and Runbook

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Recommended DB/bootstrap steps:

```bash
npx prisma migrate dev
npx prisma generate
```

The custom dev command starts Next.js via `tsx server/index.ts`.

---

## 16) Build, Lint, and Validation

Validation commands:

```bash
npm run lint
npm run build
```

Notes:
- Build can still complete while logging Redis/DB connection warnings if local infra env values are missing.
- For full runtime validation, run PostgreSQL + Redis and provide correct `.env.local`.

---

## 17) Deployment Scaffolding

Project includes deployment descriptors:
- `vercel.json` for frontend deployment shape
- `railway.json` and `Procfile` for process-based hosting

Typical lifecycle:
- Install: `npm ci`
- Build: `npm run build`
- Start: `npm run start`

---

## 18) Operational Runbook (Live Match)

1. Ensure Redis + DB connectivity and required env values.
2. Provide `CRICKET_API_KEY`.
3. Initialize live match via `/api/match/init` with valid external match id.
4. Confirm `/api/matches` and live page reflect active updates.
5. Verify no duplicated events and monotonic progression under reconnects.
6. Use runtime/debug endpoints for diagnostics when provider instability occurs.

---

## 19) Security and Reliability Measures

- Payload validation via Zod in auth flow
- Password hashing using bcryptjs
- Redis-backed session model
- Middleware route protection and role checks
- Rate-limit hooks for auth attempts
- Fail-safe behavior for missing auth context and protected route access
- Replay/event sequencing for consistency under realtime operation

---

## 20) Performance and Scalability Considerations

- Event-driven consumers decouple concerns (SSE, replay, commentary)
- Incremental update streaming over SSE reduces polling overhead
- Selector-based analytics isolates expensive transformations
- Match and account modules separated by route groups for maintainability
- Redis + DB split allows state/session concerns to scale independently

---

## 21) Limitations and Known Challenges

1. Full local runtime experience requires both PostgreSQL and Redis setup.
2. Live data quality depends on external provider stability and API key validity.
3. Project complexity is high due to broad feature surface (simulation + hosting + analytics + auth + ML scaffolding).
4. Some platform behaviors are controlled by environment toggles and rollout phase settings.

---

## 22) Future Enhancement Roadmap

1. Stronger observability dashboards for event lag and replay drift.
2. Expanded ML model serving and model version governance.
3. Advanced role-based permission matrix and audit trails.
4. Automated simulation quality benchmarking and scenario testing.
5. Tournament analytics (points-table forecasting, player impact scoring).
6. Enhanced mobile-first UX optimization for live fan usage.

---

## 23) Suggested Academic Deliverables You Can Generate From This README

Using only this file, you can generate:
- Full software project report (chaptered)
- Synopsis + abstract + objective statement
- SRS-style functional/non-functional requirement documents
- Architecture/design chapter
- Database design chapter
- API design chapter
- Testing chapter
- Deployment and maintenance chapter
- Viva Q&A preparation notes
- Project PPT content with slide-by-slide structure

---

## 24) Ready-to-Use Prompt (Report Generation)

Copy this README into any AI and use prompt:

"Using only the provided CricSmart README as source material, write a complete academic project report with title page content, abstract, introduction, literature-style context, problem statement, objectives, scope, architecture, module descriptions, database design, API design, implementation details, security, testing, deployment, results, limitations, future scope, conclusion, and references section format. Keep writing formal and submission-ready."

---

## 25) Ready-to-Use Prompt (PPT Generation)

Copy this README into any AI and use prompt:

"Using only the provided CricSmart README, generate a complete final-year project PPT outline with 20-30 slides. For each slide provide title, key bullet points, presenter notes, and suggested visual/diagram type. Ensure flow from problem statement to architecture, database, modules, API, implementation, demo flow, testing, deployment, limitations, and future scope."

---

## 26) Conclusion

CricSmart is a comprehensive cricket platform that integrates simulation, live updates, analytics, commentary intelligence, account ecosystem features, and extensible ML workflows in a single, production-oriented architecture. This README is intentionally authored as a complete source for downstream report and presentation generation.