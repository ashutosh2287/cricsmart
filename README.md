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
- Stadium overlay system for key event visualization (sixes, fours, wickets)
- Broadcast director system for cinematic effects (camera shake, sweeps, slow motion)
- Tactical overlay system for strategic insights visualization
- Crowd reaction simulation for immersive audio/visual feedback
- Match prediction panels with win probability visualization
- Match drama meters and tension indicators
- Momentum heatmaps and phase timelines
- Partnership panels and turning point banners
- Narrative timeline and match story composers

### 4.2 Realtime and Replay
- Hybrid realtime architecture: Socket.IO for room management + SSE for event streaming
- Server-Sent Events route per runtime match (`/api/realtime/[matchId]`)
- Event broadcast pipeline with enrichment (commentary, insights, analytics added to BALL_EVENT)
- Replay event persistence and timeline reconstruction
- Director-controlled cinematic replay with automated replays
- Highlight timeline management for replay systems
- Timeline comparison and interactive scrubbing capabilities
- Event sequencing and deduplication for consistency under reconnects
- Auto-replay director for automated highlight generation
- Replay queue engine for sequential event processing
- Snapshot store for state restoration at any point
- Historical match loading for replay analysis

### 4.3 Commentary and Intelligence
- Commentary generated from domain ball/wicket events through orchestration pipeline
- Multi-layered commentary system with 44+ specialized engines:
  - **Core Engines**: commentaryEngine, advancedCommentaryEngine, statisticalCommentaryEngine
  - **Personality System**: commentaryPersonalityEngine, commentaryVoiceEngine, commentaryToneEngine
  - **Context System**: commentaryContextBuilder, commentaryContextValidator, commentaryContextSnapshotStore
  - **Narrative System**: commentaryNarrativeEngine, commentaryMatchStoryEngine, commentarySummaryEngine
  - **Strategy System**: commentaryStrategyEngine, commentarySituationClassifier
  - **Enrichment**: commentaryEnrichmentEngine, commentaryPostProcessor, commentaryTranslator
  - **Retrieval**: commentaryRetrievalEngine, commentaryInferenceClient
  - **Bus System**: commentaryBus for event emission
  - **Style System**: commentaryStyle, commentaryPhrases, languageEngine
  - **Template System**: commentaryTemplateEngine
  - **Chain System**: commentaryChainEngine for multi-step generation
  - **LLM Integration**: commentaryLLMProvider for AI-powered commentary
  - **Intelligence Store**: commentaryIntelligenceStore, commentaryIntelligenceContract
  - **Timeline Store**: commentaryTimelineStore for persistence
  - **Orchestration**: commentaryOrchestrator, commentary-pipeline
  - **Audit**: commentaryParityTests, commentaryParityValidator
  - **Types**: commentaryTypes, commentaryContextTypes
  - **Index**: barrel exports for clean imports
- Commentary streamed as domain events and added to replay timeline
- Win probability updates emitted as distinct domain events
- Narrative timeline construction for match storytelling
- Match drama and tension analytics for enhanced commentary
- Probability swing modeling for heightened narrative moments
- Context-aware commentary generation using match situation analysis
- ML-enhanced commentary intelligence (experimental feature flags)

### 4.4 Analytics
- **44+ Analytics Files** organized in specialized directories:
  - **Core Engines**: analyticsEngine, globalAnalyticsEngine, matchControlEngine
  - **Metrics**: momentum, runRate, phases, pressure, projectedScore, winProbability, requiredRunRate
  - **Advanced Analytics**: matchDramaEngine, matchSituationEngine, matchNarrativeEngine, matchIntelligenceGraphEngine
  - **Player Analytics**: playerStatsEngine, bowlerStatsEngine, playerImpactEngine, playerFormEngine, playerOfMatchEngine, playerRegistryEngine
  - **Tournament Analytics**: pointsTableEngine, qualificationEngine, tournamentContextEngine, tournamentPressureEngine, tournamentStoryEngine
  - **Pattern Detection**: patternDetectionEngine for recurring event sequences
  - **Momentum**: momentumSwingEngine, momentumTimelineEngine, momentumContextEngine, momentumMeterEngine
  - **Partnership**: partnershipEngine for batting partnerships
  - **Scorecard**: scorecardEngine for detailed scorecard generation
  - **Top Performers**: topPerformersEngine for rankings
  - **Turning Points**: turningPointEngine for pivotal moments
  - **Win Probability Timeline**: winProbabilityTimelineEngine for probability tracking
  - **Live Analytics Store**: liveAnalyticsStore for real-time metrics
  - **Replay Analytics**: replayAnalyticsSelectors for post-match analysis
  - **Selectors**: analytics selectors for chart inputs
  - **Global**: global directory for centralized analytics access
  - **AI Insights**: aiInsightEngine for intelligent observations
  - **Match Insights**: matchInsightsEngine for contextual insights
  - **Context**: matchContextEngine for situation awareness
  - **Calculate Functions**: calculateMomentum, calculatePressure, calculateProjectedScore, calculateWinProbability, calculatePartnership, calculateBattingIntent, calculateBowlingPressure, calculateControlPercentage
- Charts and analytical selectors derived from replay events
- Momentum, run-rate, over progression, and probability-oriented insights
- Advanced analytics: pressure, tension, drama, turning points, player impact
- Dedicated analytics pages and match-level analytics rendering
- Real-time analytics enrichment for broadcast commentary
- Predictive analytics: projected scores, required run rates, win probability swings

### 4.5 Team, Tournament, and Player Ecosystem
- Team creation, squad management, follows/favorites
- Tournament creation and team/match linkage
- Player profile endpoints and discovery pages
- Hosted matches with member roles and save/bookmark behavior
- Team ownership model and role-based access controls
- Tournament scheduling, format management, and organizer tools
- Player milestone tracking, partnership analysis, and form assessment
- Social features: team following, favorite teams, match saving/bookmarking
- **Tournament Engine**: pointsTableEngine, qualificationEngine, tournamentContextEngine, tournamentPressureEngine, tournamentStoryEngine, tournamentStore
- **Player Engine**: playerFormEngine, playerMilestoneEngine, playerPartnershipEngine, playerRegistry, playerStore, bowlerDominanceEngine, milestoneDetector, partnershipEngine

### 4.6 Authentication and Account
- Signup/login/logout/me APIs
- Cookie-based auth session handling
- Account pages for profile, activity, settings, hosted/saved/tournament/teams views
- Middleware-based route gating for authenticated/creator/admin areas
- **16 Auth Files**: accessPolicy, authRateLimit, authRateLimitCore, authTypes, authValidation, pageAuth, password, requestAuth, requestContext, roles, routeGuard, serverRequestContext, sessionLookup, sessionStore
- Rate limiting with Upstash Redis integration
- Password hashing with bcryptjs
- Session management with configurable TTL and rotation
- Role-based access control (public, authenticated, creator, admin)
- Route protection with regex-based policy rules
- Dev bypass mode for development environments

### 4.7 Detailed Feature Explanation (Complete Feature Catalog)

This section expands every major user-facing and system-facing feature so the README can be directly reused as a report source.

#### Feature A — Home Dashboard and Match Discovery
- Shows platform-level overview (live match count, team count, total match count).
- Highlights currently running hosted matches and gives direct entry links.
- Displays live fixtures pulled from provider-backed endpoints.
- Gives fast access to key actions (all matches, create simulation, authentication entry points).
- Business value: creates a single "command center" for users to understand current cricket activity instantly.

#### Feature B — Match Simulation Creation and Control
- Users can create simulation matches by selecting/entering team names.
- The platform generates runtime match IDs and routes users to admin control screens.
- Simulation lifecycle actions include start, pause, resume, stop, speed control, and ball progression.
- Supports both auto-simulation and granular ball-event driven updates.
- **15 Simulation Files**: ballGenerator, lineup, matchSimulator, playerProfiles, playerUtils, probabilityModel, simulation-lifecycle, simulation-orchestrator, simulationEventAdapter, simulationPresets, simulationRandom, simulationReplayExport, simulationState, startSimulationClient
- **Simulation Features**: configurable match formats (T20/ODI/TEST), player profile-based realistic behavior, probability models for outcome generation, replay export capability
- Business value: enables training, analytics demos, and tactical scenario experimentation without waiting for real matches.

#### Feature C — Live Match Runtime Screen
- Real-time score, wickets, over/ball progression, and innings state rendering.
- Continuous update stream from server-side event emitters to clients.
- Displays context-aware match status and transitions across innings/endgame states.
- Integrates commentary, probability, and chart modules in one runtime viewing surface.
- **Components**: LiveScoreCard, LiveMatchStatus, LiveCommentaryFeed, MatchHeader, MatchCard
- Business value: delivers an immersive live-score and intelligence experience similar to production sports platforms.

#### Feature D — Realtime Streaming and Reconnect Reliability
- Uses SSE endpoint (`/api/realtime/[matchId]`) for event delivery to clients.
- Broadcast payloads include typed events (BALL, WICKET, COMMENTARY, probability updates, match finish).
- Client reconnect flow handles temporary disconnects and resumes synchronized state.
- Event meta (sequence, over, ball, timestamps) supports ordering and duplication control.
- **4 Realtime Files**: clientStore, connectRealtime, eventBus, realtimeController
- **Realtime Features**: exponential backoff reconnection, state recovery via afterSequence parameter, heartbeat monitoring, room-based scoping via Socket.IO
- Business value: keeps all connected users in near real-time sync with low operational complexity.

#### Feature E — Event-Driven Domain Pipeline
- Match engine emits domain events (BALL, WICKET, MATCH_FINISHED, WIN_PROBABILITY, COMMENTARY).
- Multiple independent consumers process the same stream:
  - **SSE Consumer**: Prepares enriched payloads for broadcasting
  - **Replay Consumer**: Stores timeline-compatible events for persistence
  - **Commentary Consumer**: Generates commentary through orchestration pipeline
  - **Analytics Consumer**: Updates analytics stores with event data
  - **Win Probability Consumer**: Calculates and updates win probability
- Loose coupling allows adding more consumers (alerts, metrics, notifications) without rewriting engine logic.
- **Domain Events**: 5 core event types with full TypeScript type definitions
- **Event Meta**: eventId, sequence, timestamp, runtimeMatchId, innings, over, ball, eventType
- Business value: improves extensibility, reliability, and maintainability of core cricket runtime.

#### Feature F — Commentary Intelligence
- Commentary is generated from ball/wicket context through commentary orchestration pipeline.
- **Orchestration Flow**: buildCommentaryContext → evolveCommentaryNarrative → classifyCommentarySituation → selectCommentaryTone → validateCommentaryContext → processCommentaryEvent
- Emitted as COMMENTARY domain events, then streamed and stored in timelines.
- Includes tone/importance dimensions useful for richer UX and narrative layers.
- **Tone Types**: NEUTRAL, AGGRESSIVE, EXCITED, TENSE, CALM
- **Situation Classification**: match situation analysis for context-aware commentary
- **Personality System**: applies consistent commentator personality across events
- **Voice Engine**: variation in commentary delivery style
- **Advanced Generation**: generateAdvancedCommentary for rich contextual output
- **ML Integration**: commentaryLLMProvider for AI-powered commentary generation
- Supports both live fan engagement and replay storytelling.
- Business value: transforms raw scoring events into human-readable cricket narrative.

#### Feature G — Replay Timeline and Event Persistence
- Replay events are appended with sequence-compatible metadata for reconstruction.
- Commentary timeline and ball-event timeline can be replayed after live session.
- Supports review/scrubbing use-cases for analytics, debugging, and educational playback.
- Handles match-finished and probability events as replay records.
- **13 Replay Files**: autoReplayDirector, eventTimeline, highlightEngine, legacyReplayEngine, loadHistoricalMatch, matchReplayEngine, replayController, replayEngine, replayEventUtils, replayQueueEngine, replayReducer, seekReplay, snapshotStore
- **Replay Features**: automatic highlight detection, state snapshots at over boundaries, timeline scrubbing, historical match loading, replay export
- Business value: gives historical introspection beyond "current score only" systems.

#### Feature H — Analytics and Performance Visualization
- Analytics selectors derive chart inputs from replay/event data.
- Supports momentum trends, run-rate progression, over-wise evolution, and probability movement.
- Match and player analytics pages expose data in dedicated analytical interfaces.
- Selector-based architecture keeps analytics calculations reusable and testable.
- **44+ Analytics Files** covering every aspect of match analysis
- **Visualization Components**: MomentumMeter, MomentumHeatmap, MatchDramaMeter, MatchPhaseTimeline, OversTimeline, PartnershipPanel, TurningPointBanner, NarrativeTimeline, MatchTimelineSlider
- Business value: enables tactical insight, storytelling, and post-match analysis.

#### Feature I — Hosted Matches Ecosystem
- Users can create and manage hosted matches with metadata (format, venue, schedule, teams).
- Match-specific actions include toss setup, playing XI management, score updates, and start flow.
- Supports hosted match members with role mapping for collaborative match operations.
- Includes save/bookmark interactions for user-level match tracking.
- **Match Management**: matchManager, matchRegistry, matchTabRouting, resultEngine, runtimeInitializer, createLiveMatchId
- **Events System**: events directory for match-specific event handling
- Business value: supports local clubs, campus leagues, and community organizers.

#### Feature J — Teams Management
- Team creation with identity metadata (name, short name, slug, visibility, city, logo).
- Squad/member management via dedicated APIs and manage page workflows.
- Social interactions through follow/favorite actions.
- Team ownership model anchored at `Team.ownerId`.
- **Team Services**: battingOrder, bowlingOrder, playingXI, teamValidation, toss
- Business value: builds stable team identities and long-term user engagement around clubs/franchises.

#### Feature K — Tournament Management
- Tournament creation with date range, format, location, and organizer association.
- Team enrollment into tournaments via mapping entities.
- Tournament-to-hosted-match linking for fixtures.
- Membership relation allows role-aware participation at tournament level.
- **6 Tournament Files**: pointsTableEngine, qualificationEngine, tournamentContextEngine, tournamentPressureEngine, tournamentStore, tournamentStoryEngine
- Business value: supports multi-match competition structures, not just standalone matches.

#### Feature L — Player Profiles and Discovery
- Player profile APIs and pages expose player metadata and stats snapshot fields.
- Discovery pages support browsing player information and profile-level navigation.
- Enables gradual expansion toward scouting/impact analytics.
- **9 Player Files**: bowlerDominanceEngine, milestoneDetector, partnershipEngine, playerFormEngine, playerMilestoneEngine, playerPartnershipEngine, playerRegistry, playerStore, index
- Business value: strengthens player-centric features alongside team/match-centric modules.

#### Feature M — Authentication, Session, and Access Control
- Signup/login/logout/me endpoints power account identity lifecycle.
- Password storage is hash-based; auth payloads are schema-validated.
- Session model is cookie-driven with backend session store integration.
- Middleware protects authenticated/creator/admin routes and supports redirect-based guard behavior.
- **16 Auth Files**: comprehensive auth system with rate limiting, validation, role management
- **Route Protection**: regex-based policy rules for 30+ route patterns
- **Session Management**: configurable TTL (default 7 days), rotation (default 30 minutes)
- **Security Features**: CSRF protection, session invalidation, rate limiting (6 attempts per minute)
- Business value: secures operational actions (hosting, admin controls, account data).

#### Feature N — Account Personalization
- Account module includes profile, activity, settings, teams, tournaments, hosted matches, saved matches.
- User-specific favorites/saves and participation data are consolidated in account routes.
- Provides "my cricket space" for continuity across sessions.
- Business value: improves retention and user ownership of platform activity.

#### Feature O — Live Fixture Ingestion and Runtime Health
- External fixture endpoints fetch and normalize live cricket data.
- Runtime health/debug endpoints help validate provider and ingestion behavior.
- Supports operational diagnostics for stale feeds, missing updates, and runtime readiness.
- **Provider System**: 7 files including cricapiLiveProvider, liveProvider, simulationMatchProvider, providerFactory, polling, mock, types
- **Ingestion System**: eventBuffer, liveMatchIngestor for real-time data processing
- Business value: bridges simulated and real cricket experiences in one product.

#### Feature P — Debug and Diagnostics Surface
- Dedicated debug APIs for commentary context/runtime/ML and provider/retrieval inspection.
- Runtime-check endpoints support deployment and incident troubleshooting.
- Useful for engineering verification, QA, and demo troubleshooting.
- Business value: reduces mean time to diagnose production-like data-flow issues.

#### Feature Q — ML Workspace and Intelligence Extension
- `/ml` workspace includes data ingestion, feature engineering, training, evaluation, and inference scaffolding.
- Win-probability and commentary intelligence pipelines are versionable and experiment-friendly.
- Feature flags allow gradual runtime adoption of ML-backed paths.
- **ML Service Files**: 15 directories including benchmark, calibration, commentary, contracts, dataset, feature, features, inference, observability, pipeline, prediction, schema, smoothing, snapshots, types
- **ML Features**: model versioning, feature snapshots, stability metrics, calibration, benchmarking, observability
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

#### Feature T — Animation and Visual Effects System
- **4 Animation Files**: animationBus, animationController, animationOrchestrator, animationQueue
- **Animation Features**: queue-based animation sequencing, orchestrator for complex effects, bus for event-driven animations
- **Stadium Overlay**: StadiumOverlay component for key event visualization
- **Broadcast Director**: BroadcastDirectorOverlay, BroadcastDirectorPanel for cinematic control
- **Tactical Overlay**: TacticalOverlay, TacticalInsightPanel for strategic insights
- **Crowd Reaction**: crowdReactionEngine for immersive audio/visual feedback
- Business value: creates broadcast-quality visual experience for live cricket viewing.

#### Feature U — Command and Signal Bus Architecture
- **Command Bus**: commandBus for emitting and processing commands (DOT_BALL, etc.)
- **Domain Commands**: domainCommands for match-level command handling
- **Admin Commands**: adminCommandRouter for administrative operations
- **Broadcast Commands**: broadcastCommands for broadcast-specific operations
- **Signal Buses**: tacticalSignalBus, narrativeSignalBus for inter-system communication
- **Director Signals**: directorSignals for broadcast director coordination
- **Overlay Bus**: overlayBus for overlay system coordination
- Business value: decoupled architecture enables independent system evolution.

#### Feature V — Storage and Persistence Layer
- **8 Storage Files**: eventStorage, memoryStorage, redisClient, redisEventStorage, redisMatchStorage, redisSimulationStorage, redisSimulationStorage.server, simulationStorage
- **Storage Types**: In-memory (development), Redis (production), IndexedDB (client-side)
- **Event Persistence**: eventStore, eventStorage for ball events and timeline
- **Match Persistence**: redisMatchStorage for match state persistence
- **Simulation Persistence**: simulationStorage for simulation state
- **Redis Integration**: ioredis client with connection pooling
- **Client-Side**: Dexie (IndexedDB wrapper) for offline support and caching
- Business value: flexible storage strategy supports development, production, and offline scenarios.

#### Feature W — Provider and Ingestion Architecture
- **7 Provider Files**: cricapiLiveProvider, liveProvider, simulationMatchProvider, providerFactory, polling, mock, types
- **Provider Features**: pluggable provider architecture, factory pattern for provider selection, polling for live data, mock providers for testing
- **Ingestion Files**: eventBuffer, liveMatchIngestor
- **Ingestion Features**: event buffering for batch processing, live match data normalization
- **CricAPI Integration**: external cricket data provider integration
- Business value: supports multiple data sources with unified interface.

#### Feature X — Recording and Reconciliation
- **Recording**: eventRecorder for persistent event recording
- **Reconciliation**: reconciliation directory for data consistency checks
- **Runtime**: runtime directory for runtime state management
- **Monitoring**: monitoring.ts for system health monitoring
- **Logger**: logger.ts for structured logging
- Business value: ensures data integrity and operational visibility.

---

## 5) Technology Stack

### Frontend
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Recharts (analytics visualization)
- Framer Motion (UI motion)
- Dexie (IndexedDB wrapper for client-side caching/offline support)
- Lucide React (icon library)
- Socket.IO Client (for realtime communication)
- Why-did-you-render (React performance monitoring)
- Sharp (image processing utilities)
- Pptxgenjs & Docx (report generation utilities)
- UUID (unique identifier generation)
- React Icons (additional icon library)

### Backend and API Layer
- Next.js Route Handlers
- Node.js server entry (`server/index.ts`) with Socket.IO integration
- SSE pipeline for realtime updates
- Socket.IO server (for bidirectional communication and room management)
- Event bridging between Socket.IO and SSE
- Custom HTTP server with request handling

### Data and Persistence
- PostgreSQL via Prisma ORM
- Redis (sessions, runtime/operational connectivity, rate-limiting support, Socket.IO adapter)
- Event/replay timeline persistence services (IndexedDB client-side, PostgreSQL server-side)
- Upstash Redis (for serverless environments)
- ioredis (Redis client with connection pooling)

### Security and Validation
- Zod for payload validation
- bcryptjs for password hashing
- Upstash Redis + ratelimit package for request throttling
- NextAuth.js for authentication handling
- Custom route guards for fine-grained access control
- CSRF protection (inherent in NextAuth.js)

### ML Workspace (Offline + Service)
- Python workspace under `/ml`
- Feature engineering, training, evaluation scripts
- FastAPI inference scaffold for win-probability serving
- ML model versioning and experimentation tracking
- Calibration and benchmarking utilities
- Commentary intelligence pipeline with embeddings and retrieval

---

## 6) High-Level Architecture

CricSmart follows a layered architecture with specialized subsystems:

1. **Presentation Layer**
   - Next.js pages/components (`src/app`, `src/components`)
   - UI enhancements: Stadium overlays, broadcast director effects, tactical visualizations
   - 49 component files covering all UI aspects

2. **API Layer**
   - Route handlers in `src/app/api/**/route.ts`
   - Hybrid realtime: Socket.IO (room management) + SSE (event streaming)
   - RESTful APIs for match operations, account management, and ecosystem features
   - 16 API route groups with 50+ endpoints

3. **Domain/Service Layer**
   - Core match engine: state machine, event dispatcher, simulation control
   - Analytics subsystem: 44+ specialized engines
   - Broadcast & cinematic: director system, cinematic scheduler, stadium moments, tactical overlays
   - Narrative & story: timeline construction, match storytelling, contextual commentary
   - Replay systems: 13 files for event persistence, timeline reconstruction, highlight management
   - Player & tournament: 15 files for performance analytics, milestone tracking, partnership analysis
   - Communication: 44+ commentary files for generation, personality, voice engineering
   - Animation system: 4 files for visual effects orchestration
   - Command bus: decoupled command handling architecture
   - Signal buses: inter-system communication channels
   - ML services: 15 directories for prediction, inference, calibration
   - Storage layer: 8 files for multi-strategy persistence
   - Provider system: 7 files for pluggable data sources
   - Auth system: 16 files for comprehensive security
   - Simulation system: 15 files for match simulation
   - Recording system: event recording and reconciliation
   - Monitoring: system health and logging

4. **Domain Event Layer**
   - Event bus + domain consumers for SSE/replay/commentary (`src/domain`)
   - 5 core event types: BALL, WICKET, MATCH_FINISHED, WIN_PROBABILITY, COMMENTARY
   - 6 domain consumers: SSE, Replay, Commentary, Analytics, WinProbability
   - Event meta with sequence, timestamp, and match context

5. **Persistence Layer**
   - Prisma repositories and schema (`prisma/schema.prisma`, `src/lib`, `src/persistence`)
   - Event/replay timeline persistence services (IndexedDB client-side, PostgreSQL server-side)
   - Analytics store for computed metrics and insights
   - Director memory and profile storage for cinematic consistency
   - Redis for sessions, match state, and simulation storage
   - In-memory storage for development environments

6. **External Integrations**
   - CricAPI live fixtures, Redis (sessions, rate limiting, Socket.IO adapter), optional ML inference service
   - Upstash Redis for serverless environments
   - External cricket data providers

### Event-Driven Flow (Enhanced)
1. Match engine emits domain events (BALL, WICKET, MATCH_STARTED, MATCH_FINISHED, INNINGS_START, OVERS_START, PLAYER_MILESTONE, etc.) via `eventDispatcher.ts`
2. State changes trigger match engine updates through `matchStateMachine.ts`
3. Domain events are processed by independent consumers in `src/domain/consumers/`:
   - **SSE Consumer**: Prepares enriched payloads (adds commentary, insights, analytics) for broadcasting
   - **Replay Consumer**: Persists events to timeline with sequence metadata
   - **Commentary Consumer**: Generates commentary through orchestration pipeline (statistical → personality → voice)
   - **Analytics Consumer**: Updates specialized analytics engines (momentum, pressure, tension, etc.)
   - **Win Probability Consumer**: Calculates and updates win probability
4. Enriched events are broadcast via SSE with additional context:
   - BALL_EVENT payloads include: live commentary, broadcast insights, real-time analytics
   - Other event types maintain core data with minimal enrichment
5. Client-side systems process updates:
   - Presentation layer updates scoreboard, commentary, and visualizations
   - Stadium overlay system activates for key events (sixes, fours, wickets)
   - Broadcast director triggers cinematic effects (camera shakes, sweeps, slow motion)
   - Tactical overlay system displays strategic insights
   - Analytics views update with latest computed metrics
6. Client reconnect logic ensures continuity:
   - Automatic reconnection with exponential backoff
   - State recovery using `afterSequence` parameter
   - Heartbeat monitoring for connection health
   - Room-based scoping via Socket.IO for efficient event distribution

---

## 7) Repository Structure (Important Folders)

- `src/app/` → App Router pages and API routes
- `src/components/` → 49 reusable UI components
- `src/services/` → 95 domain/business logic files organized by concern:
  - Core services: matchEngine.ts (1539 lines), eventDispatcher.ts, realtimeEvents.ts, commentaryService.ts
  - Analytics: analytics/ (44+ files including metrics, engines, stores, selectors)
  - Broadcast & Cinematic: broadcastDirector.ts, cinematicScheduler.ts, stadiumMoment.ts, tacticalEngine/, director/
  - Narrative & Story: narrative/ (8 files), story/ (4 files)
  - Highlights: highlights/ (2 files)
  - Replay: replay/ (13 files)
  - Player: player/ (9 files)
  - Tournament: tournament/ (6 files)
  - Commentary: commentary/ (44+ files)
  - Animation: animationBus.ts, animationController.ts, animationOrchestrator.ts, animationQueue.ts
  - Queue & Timing: eventQueue.ts, timelineComparison.ts, timelineScrubber.ts
  - Director Systems: directorMemory.ts, directorProfile.ts, predictiveDirector.ts
  - Engines: pressureEngine.ts, tensionEngine.ts, crowdReactionEngine.ts
  - Bootstrapping: engineBootstrap.ts, broadcastCommands.ts
  - ML: ml/ (15 directories)
  - Storage: storage/ (8 files)
  - Auth: auth/ (16 files)
  - Providers: providers/ (7 files)
  - Simulation: simulation/ (15 files)
  - Recording: recording/
  - Reconciliation: reconciliation/
  - Runtime: runtime/
  - Monitoring: monitoring.ts
  - Logger: logger.ts
- `src/domain/` → event bus, event definitions, domain consumers
- `src/lib/` → infrastructure helpers and repositories (database, utilities, validation)
- `src/persistence/` → event store abstractions and adapters (IndexedDB, PostgreSQL)
- `src/types/` → 9 shared TypeScript domain types (match, player, commentary, realtime, etc.)
- `src/config/` → 5 configuration files (auth, commentaryMlMode, commentaryMlRuntimeFlags, mlMode, providerMode)
- `src/constants/` → shared constants
- `src/context/` → React context providers
- `src/data/` → static data files
- `src/domain/` → domain event definitions and consumers
- `src/features/` → feature-specific modules
- `src/hooks/` → custom React hooks
- `src/providers/` → context providers
- `src/store/` → state management
- `src/styles/` → global styles
- `prisma/` → schema + migrations
- `server/` → custom server bootstrap (Socket.IO initialization, HTTP server)
- `ml/` → ML data, training, evaluation, inference workspace
- `docs/screenshots/` → project visual assets

---

## 8) Data Model (Prisma) — Entity Summary

Primary entities:
- **User**: identity, credentials, role, profile relation, avatar
- **Team**: core team metadata, owner relation, visibility, followers/favorites, description, city
- **TeamMember**: membership and role mapping, jersey number, player role
- **PlayerProfile**: player metadata and snapshot stats, batting/bowling style
- **HostedMatch**: hosted match metadata, status, toss/batting setup, runtime link, scoring mode, visibility
- **HostedMatchMember**: user-role mapping for hosted match
- **Tournament**: organizer-owned tournament metadata, banner, dates, visibility
- **TournamentTeam**: team participation mapping
- **TournamentMatch**: hosted match attachment to tournaments
- **TeamFollow/FavoriteTeam/SavedMatch**: account-level social/bookmark features
- **TournamentMember**: user-level tournament participation and role

Enums include:
- `TeamMemberRole`: OWNER, MEMBER
- `TeamVisibility`: PUBLIC, PRIVATE
- `MatchStatus`: DRAFT, LIVE, COMPLETED
- `TossDecision`: BAT, BOWL

Database Features:
- **Indexes**: team.ownerId, team.slug, teamMember.userId, teamMember.teamId, hostedMatch.runtimeMatchId, hostedMatch.createdById
- **Unique Constraints**: team.slug, teamMember.[teamId, userId], hostedMatch.slug, tournamentTeam.[tournamentId, teamId], tournamentMatch.[tournamentId, hostedMatchId], teamFollow.[userId, teamId], favoriteTeam.[userId, teamId], savedMatch.[userId, hostedMatchId], tournamentMember.[tournamentId, userId]
- **Cascade Deletes**: User → Teams, Team → Members, HostedMatch → Members, Tournament → Teams/Matches/Members
- **Restrict Deletes**: Team → HostedMatch (prevents deleting team with active matches)
- **SetNull**: PlayerProfile.user, HostedMatch.tossWinner, HostedMatch.battingFirst

---

## 9) Route and API Surface

### 9.1 Web Pages (Examples)
- `/` home dashboard (redirects to `/home` when authenticated)
- `/home` authenticated home dashboard
- `/matches`, `/matches/[id]`, `/match/[runtimeMatchId]`
- `/hosted-matches`, `/hosted-matches/[id]`, `/hosted-matches/[id]/control`, `/hosted-matches/[id]/score`
- `/teams`, `/teams/create`, `/teams/[slug]`, `/teams/[slug]/manage`
- `/tournaments`, `/tournaments/create`, `/tournaments/[id]`
- `/players`, `/players/discover`, `/players/profiles/[id]`
- `/analytics`, `/analytics/players`
- `/admin/[matchId]`
- `/login`, `/signup`
- `/account` and nested pages (profile, activity, settings, teams, tournaments, hosted matches, saved matches)
- `/(landing)/` landing page
- `/host/matches/create` hosted match creation

### 9.2 API Groups (Comprehensive)

**Auth and account**
- `/api/auth/login` (POST, email/password authentication)
- `/api/auth/signup` (POST, user registration with Zod validation)
- `/api/auth/logout` (POST, session invalidation)
- `/api/auth/me` (GET, current user info)
- `/api/account/profile` (GET/PUT, user profile management)
- `/api/account/password` (PUT, password change with bcrypt hashing)
- `/api/account/favorites` (GET/POST/DELETE, team favorites)
- `/api/account/hosted-matches` (GET, user's hosted matches)
- `/api/account/saved-matches` (GET/POST/DELETE, saved matches)
- `/api/account/tournaments` (GET, user's tournaments)
- `/api/account/activity` (GET, user activity feed)

**Match simulation/runtime**
- `/api/create-match` (POST, create new simulation match)
- `/api/start-simulation` (POST, start simulation with teams/format)
- `/api/set-speed` (POST, set simulation speed multiplier)
- `/api/match` (GET, generic match operations)
- `/api/match/init` (POST, initialize match from external fixture ID)
- `/api/match/stop` (POST, stop and cleanup match)
- `/api/match/[matchId]` (GET, match-specific operations)
- `/api/match/[matchId]/ball` (POST, process ball-by-ball events)
- `/api/matches` (GET, list all matches)
- `/api/matches/delete` (POST, delete match)
- `/api/matches/[id]/start` (POST, start hosted match)
- `/api/simulation/lifecycle` (POST, simulation lifecycle control)
- `/api/simulation/runtime` (GET/POST, get/set simulation runtime properties)
- `/api/simulation/speed` (GET/POST, set/get simulation speed)
- `/api/simulation/pause` (POST, pause simulation)
- `/api/simulation/resume` (POST, resume simulation)
- `/api/simulation/stop` (POST, stop simulation)
- `/api/simulation/export` (GET, export match event timeline)

**Realtime/live/debug**
- `/api/realtime/[matchId]` (GET, Server-Sent Events stream for match updates)
- `/api/live/fixtures` (GET, fetch live cricket fixtures from provider)
- `/api/live/runtime-check` (GET, validate live session health)
- `/api/events` (POST, administrative event posting endpoint)
- `/api/debug/commentary` (GET, commentary service debugging)
- `/api/debug/commentary-context` (GET, commentary context inspection)
- `/api/debug/commentary-ml` (GET, ML-powered commentary debugging)
- `/api/debug/commentary-runtime` (GET, commentary runtime inspection)
- `/api/debug/providers` (GET, data provider debugging)
- `/api/debug/retrieval` (GET, data retrieval debugging)
- `/api/debug/ml` (GET, ML model debugging)

**Hosted match and ecosystem**
- `/api/hosted-matches` (GET/POST, hosted match CRUD operations)
  - Nested routes: `[matchId]` (specific match), `members`, `playing-xi`, `score`, `start`, `toss`, `save`, `control`
- `/api/teams` (GET/POST, team CRUD operations)
  - Nested routes: `[slug]` (specific team), `members`, `favorite`, `follow`, `squad`
- `/api/tournaments` (GET/POST, tournament CRUD operations)
  - Nested routes: `[id]` (specific tournament), `teams`, `matches`
- `/api/player-profiles` (GET/POST, player profile operations)
  - Nested routes: `[id]` (specific player profile)

---

## 10) Authentication and Authorization Model

- Cookie-based session authentication via NextAuth.js
- Custom route guards (`requireRouteAccess`) enforce access policies per endpoint
- Access categories:
  - `public`: accessible to all users
  - `authenticated`: requires valid user session
  - `creator`: authenticated users with team/tournament creation privileges
  - `admin`: privileged operator paths for platform management
- Role-based access control:
  - `User.role` field stores role assignment (default: "public")
  - Middleware checks role and scope for route protection
  - Admin role supports operator paths (match control, system configuration)
  - Admin roles: "operator", "admin", "internal"
- Authentication flow:
  - Credentials provider (email/password) with bcryptjs hashing
  - Session tokens managed by NextAuth.js
  - Unauthenticated protected requests redirect to `/login?redirect=...`
  - Login route redirects authenticated users to `/account`
  - Root `/` redirects authenticated users to `/home`
- Security enhancements:
  - Payload validation via Zod schemas
  - Rate limiting for auth attempts (Upstash Redis + ratelimit)
  - CSRF protection (inherent in NextAuth.js)
  - Session invalidation on suspicious activity
  - Configurable session TTL (default: 604800 seconds = 7 days) and rotation (default: 1800 seconds = 30 minutes)
  - Rate limit: 6 attempts per 60-second window
  - Dev bypass mode for development environments (`AUTH_ALLOW_DEV_BYPASS`)
- Route protection:
  - 30+ regex-based route policy rules
  - Automatic redirect to login with return URL
  - Middleware matcher excludes API routes, static files, and images

---

## 11) Realtime and Simulation Design

### Dual Transport Architecture
CricSmart employs a hybrid realtime architecture combining Socket.IO and Server-Sent Events (SSE):
1. **Socket.IO**: Used for bidirectional communication and room management (join/leave match rooms)
2. **SSE**: Used for efficient server-to-client event streaming with automatic reconnect handling
3. **Event Bridging**: Socket.IO events are bridged to SSE via `emitToMatch()` to ensure all clients receive updates regardless of transport

### Match Engine & Event Flow
1. Match engine mutates match state per ball events via `matchStateMachine.ts` (1539 lines)
2. State changes emit domain events through `eventDispatcher.ts` (centralized event publisher)
3. Domain events are processed by independent consumers in `src/domain/consumers/`:
   - **SSE Consumer**: Prepares payloads for SSE enrichment and transmission
   - **Replay Consumer**: Stores timeline-compatible events for persistence
   - **Commentary Consumer**: Generates commentary from match context
   - **Analytics Consumer**: Updates analytics stores with event data
   - **Win Probability Consumer**: Calculates and updates win probability
4. Enriched events are broadcast to clients via SSE with additional context:
   - **BALL_EVENT** payloads include: commentary, broadcast insights, and live analytics
   - Other event types (WICKET, MATCH_FINISHED, etc.) are transmitted as-is
5. Client reconnect logic handles:
   - Automatic reconnection with retry mechanism (2000ms interval)
   - State recovery using `afterSequence` parameter to resume from last received event
   - Heartbeat messages (`: keepalive`) to detect connection liveness

### Match State Machine
- **MatchState**: Complete match state including teams, innings, toss, winner
- **InningsState**: Per-innings state including runs, wickets, overs, batting/bowling records
- **BallEvent**: Individual ball events with runs, extras, wickets, player information
- **ScoringEvent**: Engine-level scoring events (RUN, FOUR, SIX, WICKET, WD, NB, BYE, LB)
- **Correction Events**: UNDO_LAST, DELETE, REPLACE for score corrections
- **Match Formats**: T20, ODI, TEST with configurable overs
- **State Snapshots**: Saved at over boundaries for replay and restoration
- **Temporal Index**: Event indexing for efficient timeline navigation

### Simulation System
- **15 Simulation Files**: ballGenerator, lineup, matchSimulator, playerProfiles, playerUtils, probabilityModel, simulation-lifecycle, simulation-orchestrator, simulationEventAdapter, simulationPresets, simulationRandom, simulationReplayExport, simulationState, startSimulationClient
- **Simulation Features**:
  - Configurable match formats (T20/ODI/TEST)
  - Player profile-based realistic behavior
  - Probability models for outcome generation
  - Replay export capability
  - Lifecycle management (start, pause, resume, stop)
  - Speed control for simulation pacing
  - Preset configurations for common scenarios
  - Random number generation for realistic outcomes

### Key Outputs Preserved by Design
- Scoreboard consistency through sequential event processing
- Commentary continuity via contextual enrichment in broadcast
- Event sequencing with monotonic sequence numbers
- Replay compatibility through persistent timeline storage
- Room-based scoping ensuring users only receive events for matches they've joined

---

## 12) Analytics and Decision Intelligence

### Analytics Architecture
CricSmart features a granular analytics system with 44+ specialized engines that compute domain-specific metrics from event streams. Each engine operates independently and contributes to a unified analytics store.

### Core Analytics Engines
- **Momentum Engine** (`src/services/analytics/metrics/momentum.ts`): Calculates match momentum based on scoring patterns and wicket frequency
- **Run Rate Engine** (`src/services/analytics/metrics/runRate.ts`): Computes current and projected run rates
- **Phases Engine** (`src/services/analytics/metrics/phases.ts`): Identifies match phases (powerplay, middle overs, death overs)
- **Pressure Engine** (`src/services/analytics/metrics/pressure.ts`): Measures batting/bowling pressure based on required rate and wickets in hand
- **Tension Engine** (`src/services/tensionEngine.ts`): Computes narrative tension for broadcast enhancement
- **Match Drama Engine** (`src/services/analytics/matchDramaEngine.ts`): Quantifies match drama based on volatility and significance of events
- **Required Run Rate Engine** (`src/services/analytics/requiredRunRateEngine.ts`): Calculates runs needed per over to reach target
- **Turning Point Engine** (`src/services/analytics/turningPointEngine.ts`): Identifies pivotal moments that changed match outcome
- **Player Stats Engine** (`src/services/analytics/playerStatsEngine.ts`): Tracks individual player performance metrics
- **Bowler Stats Engine** (`src/services/analytics/bowlerStatsEngine.ts`): Bowler-specific analytics (economy, strike rate, etc.)
- **Top Performers Engine** (`src/services/analytics/topPerformersEngine.ts`): Rankings of batters/bowlers by impact
- **Player Impact Engine** (`src/services/analytics/playerImpactEngine.ts`): Measures player contribution to match outcome
- **Match Intelligence Graph Engine** (`src/services/analytics/matchIntelligenceGraphEngine.ts`): Builds relationship graphs between events
- **Pattern Detection Engine** (`src/services/analytics/patternDetectionEngine.ts`): Recursively detects repeating patterns in event sequences
- **Match Situation Engine** (`src/services/analytics/matchSituationEngine.ts`): Evaluates current match state (pressure, advantage, etc.)
- **Match Narrative Engine** (`src/services/analytics/matchNarrativeEngine.ts`): Builds coherent match storylines from events
- **Projected Score Engine** (`src/services/analytics/projectedScoreEngine.ts`): Predicts final score based on current trajectory
- **Global Analytics Engine** (`src/services/analytics/globalAnalyticsEngine.ts`): Provides centralized access to computed analytics
- **Win Probability Timeline Engine** (`src/services/analytics/winProbabilityTimelineEngine.ts`): Tracks win probability over time
- **Momentum Swing Engine** (`src/services/analytics/momentumSwingEngine.ts`): Detects momentum shifts
- **Momentum Timeline Engine** (`src/services/analytics/momentumTimelineEngine.ts`): Timeline of momentum changes
- **Partnership Engine** (`src/services/analytics/partnershipEngine.ts`): Batting partnership analysis
- **Scorecard Engine** (`src/services/analytics/scorecardEngine.ts`): Detailed scorecard generation
- **Player Form Engine** (`src/services/analytics/playerFormEngine.ts`): Player form assessment
- **Player of Match Engine** (`src/services/analytics/playerOfMatchEngine.ts`): Player of match selection
- **Player Registry Engine** (`src/services/analytics/playerRegistryEngine.ts`): Player registry management
- **Match Context Engine** (`src/services/analytics/matchContextEngine.ts`): Match context awareness
- **Match Insights Engine** (`src/services/analytics/matchInsightsEngine.ts`): Contextual insights generation
- **AI Insight Engine** (`src/services/analytics/aiInsightEngine.ts`): AI-powered insights
- **Analytics Engine** (`src/services/analytics/analyticsEngine.ts`): Core analytics orchestration
- **Match Control Engine** (`src/services/analytics/matchControlEngine.ts`): Calculation flow management
- **Match Analytics Aggregator** (`src/services/analytics/matchAnalyticsAggregator.ts`): Analytics aggregation
- **Live Analytics Store** (`src/services/analytics/liveAnalyticsStore.ts`): Real-time metrics storage
- **Replay Analytics Selectors** (`src/services/analytics/replayAnalyticsSelectors.ts`): Post-match analysis
- **Global Analytics** (`src/services/analytics/global/`): Centralized analytics access

### Calculate Functions
- **calculateMomentum**: Momentum calculation from ball events
- **calculatePressure**: Pressure measurement based on match situation
- **calculateProjectedScore**: Score projection based on current trajectory
- **calculateWinProbability**: Win probability computation
- **calculatePartnership**: Partnership analysis
- **calculateBattingIntent**: Batting intent assessment
- **calculateBowlingPressure**: Bowling pressure measurement
- **calculateControlPercentage**: Control percentage calculation

### Data Flow & Integration
1. Match events are consumed by `analyticsConsumer.ts` in the domain layer
2. Consumer updates specialized analytics engines via the analytics store
3. Engines compute metrics independently and store results in normalized format
4. UI components subscribe to analytics store for reactive updates
5. Live analytics are enriched into SSE broadcasts via `realtimeController.ts` for real-time commentary insights
6. Analytics control engine (`matchControlEngine.ts`) manages calculation flow and dependencies

### UI Integration
- **Visualization Components**: MomentumMeter, MomentumHeatmap, MatchDramaMeter, MatchPhaseTimeline, OversTimeline, PartnershipPanel, TurningPointBanner, NarrativeTimeline, MatchTimelineSlider, MatchPredictionPanel, MatchInsightPanel, MatchStory, StrategyDashboard, TacticalInsightPanel
- Analytics Selectors: Derive chart inputs from replay/event data
- Recharts Library: Used for rendering momentum trends, run rate progression, worm graphs
- Computation Isolation: Expensive analytics run in background services, keeping UI rendering lean
- Selector-Based Architecture: Enables reuse and testing of analytics calculations

---

## 13) ML Workspace and Integration Path

The `/ml` workspace supports a separate but connected lifecycle:

### Win Probability Pipeline
1. Dataset ingestion: `python ml/datasets/ingest_cricsheet_t20.py --input <dir> --out ml/datasets/processed`
2. Feature engineering: `python ml/feature-engineering/build_training_snapshots.py --input ml/datasets/processed/normalized_deliveries.csv --out ml/datasets/processed/training_snapshots.csv`
3. Model training: `python ml/training/train_win_probability.py --data ml/datasets/processed/training_snapshots.csv --out-dir ml/models`
4. Evaluation: `python ml/training/evaluate_model.py --data ml/datasets/processed/training_snapshots.csv --model ml/models/win_probability_model.joblib --metadata ml/models/model_metadata.json --out ml/models/evaluation_report.json`
5. FastAPI inference: `uvicorn ml.inference.main:app --host 0.0.0.0 --port 8080`

### Commentary Intelligence Pipeline
1. Dataset building: `python ml/commentary/preprocessing/build_commentary_dataset.py --out ml/commentary/datasets/commentary_dataset.csv`
2. Embedding generation: `python ml/commentary/embeddings/generate_embeddings.py --data ml/commentary/datasets/commentary_dataset.csv`
3. Retrieval index: `python ml/commentary/retrieval/commentary_index.py`
4. Ranker training: `python ml/commentary/training/train_commentary_ranker.py --data ml/commentary/datasets/commentary_dataset.csv`
5. Inference: `python ml/commentary/inference/predict_commentary_context.py --model ml/commentary/models/commentary_ranker.joblib`
6. Evaluation: `python ml/commentary/evaluation/commentary_metrics.py --data ml/commentary/datasets/commentary_dataset.csv`

### ML Service Integration (15 Directories)
- `benchmark/` - Model benchmarking utilities
- `calibration/` - Probability calibration
- `commentary/` - Commentary intelligence
- `contracts/` - Data contracts
- `dataset/` - Dataset management
- `feature/` - Feature extraction
- `features/` - Feature store
- `inference/` - Model inference
- `observability/` - Model monitoring
- `pipeline/` - ML pipeline orchestration
- `prediction/` - Prediction services
- `schema/` - Data schemas
- `smoothing/` - Smoothing algorithms
- `snapshots/` - Feature snapshots
- `types/` - TypeScript types

### Runtime Feature Flags
- `WIN_PROBABILITY_MODE` (`legacy` / `ml_local`)
- `WIN_PROBABILITY_DEBOUNCE_MS`
- `COMMENTARY_ML_MODE` - Commentary ML integration mode
- `COMMENTARY_ML_RUNTIME_FLAGS` - Runtime flags for commentary ML
- `ML_MODE` - General ML mode configuration
- `PROVIDER_MODE` - Data provider mode

---

## 14) Environment Configuration

Create `.env.local` from `.env.example` and set values:

**Core Configuration:**
- `REDIS_URL=redis://localhost:6379`
- `DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cricsmart`
- `CRICKET_API_KEY=` (required for live fixtures)
- `CRICAPI_POLL_INTERVAL_MS=60000` (polling interval in milliseconds)
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`
- `NEXT_PUBLIC_ERROR_ENDPOINT=` (optional error reporting endpoint)
- `LOG_LEVEL=info` (debug, info, warn, error)

**Auth-related keys:**
- `AUTH_ENABLED=true` (enable/disable authentication)
- `AUTH_ROLLOUT_PHASE=1` (rollout phase for gradual enablement)
- `AUTH_COOKIE_NAME=cricsmart_session`
- `AUTH_SESSION_TTL_SECONDS=604800` (7 days default)
- `AUTH_SESSION_ROTATE_SECONDS=1800` (30 minutes default)
- `AUTH_RATE_LIMIT_WINDOW_SECONDS=60`
- `AUTH_RATE_LIMIT_MAX_ATTEMPTS=6`
- `AUTH_ALLOW_DEV_BYPASS=false` (development bypass mode)
- `AUTH_ENFORCE_SSE=false` (enforce SSE authentication)

**Socket.IO Configuration:**
- `SOCKET_ALLOWED_ORIGINS=http://localhost:3000`

Optional bootstrap credentials can be set for admin/operator/internal initialization during rollout.

---

## 15) Local Setup and Runbook

```bash
npm ci
cp .env.example .env.local
# Edit .env.local with your database and Redis credentials
npm run dev
```

Recommended DB/bootstrap steps:

```bash
npx prisma migrate dev
npx prisma generate
```

The custom dev command starts Next.js via `tsx server/index.ts`.

### ML Setup (Optional)
```bash
cd ml
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

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
- Prisma client is auto-generated on `postinstall`, `predev`, and `prebuild`.

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
- Rate-limit hooks for auth attempts (6 attempts per 60 seconds)
- Fail-safe behavior for missing auth context and protected route access
- Replay/event sequencing for consistency under realtime operation
- CSRF protection via NextAuth.js
- Session invalidation on suspicious activity
- Configurable session TTL and rotation
- Dev bypass mode for development environments
- Route policy segmentation (public/authenticated/creator/admin)

---

## 20) Performance and Scalability Considerations

- Event-driven consumers decouple concerns (SSE, replay, commentary)
- Incremental update streaming over SSE reduces polling overhead
- Selector-based analytics isolates expensive transformations
- Match and account modules separated by route groups for maintainability
- Redis + DB split allows state/session concerns to scale independently
- In-memory storage for development environments
- Client-side IndexedDB (Dexie) for offline support and caching
- Connection pooling via ioredis for Redis efficiency
- Prisma connection pooling for database efficiency

---

## 21) Limitations and Known Challenges

1. Full local runtime experience requires both PostgreSQL and Redis setup.
2. Live data quality depends on external provider stability and API key validity.
3. Project complexity is high due to broad feature surface (simulation + hosting + analytics + auth + ML scaffolding).
4. Some platform behaviors are controlled by environment toggles and rollout phase settings.
5. ML workspace requires Python environment setup separate from Node.js.
6. Commentary intelligence pipeline is experimental and requires additional training data.
7. Broadcast director effects are limited to predefined cinematic patterns.

---

## 22) Future Enhancement Roadmap

1. Stronger observability dashboards for event lag and replay drift.
2. Expanded ML model serving and model version governance.
3. Advanced role-based permission matrix and audit trails.
4. Automated simulation quality benchmarking and scenario testing.
5. Tournament analytics (points-table forecasting, player impact scoring).
6. Enhanced mobile-first UX optimization for live fan usage.
7. WebSocket upgrade for bidirectional realtime communication.
8. Multi-language commentary support.
9. Advanced player scouting and recruitment analytics.
10. Integration with additional cricket data providers.

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
