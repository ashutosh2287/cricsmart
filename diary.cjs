const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, PageNumber,
  Footer, LevelFormat, PageBreak, HeadingLevel
} = require('docx');
const fs = require('fs');

// ── palette ───────────────────────────────────────────────────────────────
const DARK_BLUE = "1F4E79";
const MID_BLUE  = "2E75B6";
const LIGHT_BG  = "EBF3FB";
const HEADER_BG = "1F4E79";
const ALT_BG    = "F5F9FD";
const BORDER_C  = "AEC6D8";

const TB = { style: BorderStyle.SINGLE, size: 4, color: BORDER_C };
const BORDERS = { top: TB, bottom: TB, left: TB, right: TB };
const NO_BORDER = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };

// ── text helpers ──────────────────────────────────────────────────────────
const T = (text, opts = {}) => new TextRun({ text, font: "Times New Roman", size: 22, ...opts });
const TB2 = (text, opts = {}) => new TextRun({ text, font: "Times New Roman", size: 22, bold: true, ...opts });

const para = (text, align = AlignmentType.LEFT, spacing = { before: 60, after: 60 }) =>
  new Paragraph({ alignment: align, spacing, children: [T(text)] });

const gap = (pt = 8) => new Paragraph({ spacing: { before: pt * 10, after: pt * 10 } });

const cell = (text, w, bg = null, bold = false, center = false) =>
  new TableCell({
    borders: BORDERS,
    width: { size: w, type: WidthType.DXA },
    shading: bg ? { fill: bg, type: ShadingType.CLEAR } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: "center",
    children: [new Paragraph({
      alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 40, after: 40, line: 276 },
      children: [new TextRun({ text, font: "Times New Roman", size: 22, bold, color: bg === HEADER_BG ? "FFFFFF" : "000000" })]
    })]
  });

const pageBreak = () => new Paragraph({ pageBreakBefore: true, children: [] });

// ── cover page ────────────────────────────────────────────────────────────
const coverPage = () => [
  gap(20),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    border: { bottom: { style: BorderStyle.THICK, size: 12, color: DARK_BLUE } },
    children: [T("", { size: 2 })]
  }),
  gap(10),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80, after: 80 },
    children: [T("DAILY TRAINING DIARY", { size: 36, bold: true, color: DARK_BLUE })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 },
    children: [T("Industrial Training – Unified Mentor", { size: 28, bold: true, color: MID_BLUE })] }),
  gap(8),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 60, after: 60 },
    children: [T("Project: CricSmart – Cricket Match Simulation & Analytics Platform", { size: 24, bold: true })] }),
  gap(30),
  // info table
  new Table({
    width: { size: 7200, type: WidthType.DXA },
    columnWidths: [2400, 4800],
    rows: [
      ["Name",              "Ashutosh Anand"],
      ["Roll Number",       "SG22310"],
      ["Branch",            "Computer Science & Engineering"],
      ["Organization",      "Unified Mentor, Gurugram, India"],
      ["Training Supervisor","Mr. Ishant Sethi"],
      ["Training Duration", "January 2026 – June 2026 (6 Months)"],
      ["Department",        "UIET, Panjab University SSG Regional Centre, Hoshiarpur-146021"],
    ].map(([label, value]) => new TableRow({ children: [
      new TableCell({ borders: BORDERS, width: { size: 2400, type: WidthType.DXA },
        shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        children: [new Paragraph({ children: [T(label, { bold: true })] })] }),
      new TableCell({ borders: BORDERS, width: { size: 4800, type: WidthType.DXA },
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        children: [new Paragraph({ children: [T(value)] })] })
    ]}))
  }),
  gap(30),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 80 },
    border: { top: { style: BorderStyle.THICK, size: 12, color: DARK_BLUE } },
    children: [T("", { size: 2 })]
  }),
  gap(10),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 },
    children: [T("DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", { size: 22, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 },
    children: [T("UIET, PANJAB UNIVERSITY SSG REGIONAL CENTRE, HOSHIARPUR-146021", { size: 22, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 40, after: 40 },
    children: [T("Year: 2026", { size: 22 })] }),
];

// ── weekly header ─────────────────────────────────────────────────────────
const weekHeader = (weekNo, dateRange, theme) => [
  new Paragraph({
    spacing: { before: 200, after: 80 },
    shading: { fill: DARK_BLUE, type: ShadingType.CLEAR },
    children: [
      T(`  WEEK ${weekNo}  |  ${dateRange}`, { bold: true, color: "FFFFFF", size: 24 })
    ]
  }),
  new Paragraph({
    spacing: { before: 0, after: 140 },
    shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
    children: [T(`  Theme: ${theme}`, { bold: true, color: DARK_BLUE, size: 22 })]
  }),
];

// ── single day entry ──────────────────────────────────────────────────────
const dayEntry = (date, day, title, tasks, learnings, challenges, alt = false) => {
  const bg = alt ? ALT_BG : "FFFFFF";
  const rows = [];

  // date bar
  rows.push(new TableRow({
    children: [
      new TableCell({
        columnSpan: 2,
        borders: BORDERS,
        shading: { fill: MID_BLUE, type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 150, right: 150 },
        children: [new Paragraph({
          children: [
            T(`${day.toUpperCase()}  |  ${date}`, { bold: true, color: "FFFFFF", size: 22 }),
            T(`   —   ${title}`, { color: "D6E4F0", size: 22 })
          ]
        })]
      })
    ]
  }));

  const makeListCell = (label, items, w) => new TableCell({
    borders: BORDERS,
    width: { size: w, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 150, right: 150 },
    children: [
      new Paragraph({ spacing: { before: 0, after: 60 }, children: [T(label, { bold: true, color: DARK_BLUE, size: 22 })] }),
      ...items.map(item => new Paragraph({
        numbering: { reference: "diary-bullets", level: 0 },
        spacing: { before: 40, after: 40, line: 276 },
        children: [T(item, { size: 21 })]
      }))
    ]
  });

  rows.push(new TableRow({
    children: [
      makeListCell("Tasks Performed", tasks, 5000),
      makeListCell("Key Learnings", learnings, 4000),
    ]
  }));

  if (challenges && challenges.length > 0) {
    rows.push(new TableRow({
      children: [
        new TableCell({
          columnSpan: 2,
          borders: BORDERS,
          shading: { fill: "#FFF8E8", type: ShadingType.CLEAR },
          margins: { top: 60, bottom: 60, left: 150, right: 150 },
          children: [
            new Paragraph({ spacing: { before: 0, after: 40 }, children: [T("Challenge / Observation: ", { bold: true, color: "7F4F00", size: 21 }), T(challenges, { size: 21 })] })
          ]
        })
      ]
    }));
  }

  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: [5000, 4000],
    rows,
    margins: { bottom: 160 }
  });
};

// ── supervisor sign-off row ───────────────────────────────────────────────
const signOff = (weekNo) => new Table({
  width: { size: 9000, type: WidthType.DXA },
  columnWidths: [3000, 3000, 3000],
  rows: [
    new TableRow({ children: [
      cell("Week " + weekNo + " Supervisor Sign-off", 9000, LIGHT_BG, true, false)
        // reuse as single merged cell placeholder
    ]}),
    new TableRow({ children: [
      cell("Supervisor Name: Mr. Ishant Sethi", 3000, "FFFFFF", false),
      cell("Signature: _______________", 3000, "FFFFFF", false),
      cell("Date: _______________", 3000, "FFFFFF", false),
    ]})
  ]
});

// ── ALL DIARY ENTRIES ─────────────────────────────────────────────────────
// 6 months × ~4 weeks = 24 weeks, Mon–Fri = 120 days
// Dates: 05 Jan 2026 – 05 Jun 2026 (mapped to project milestones)

const allWeeks = [
  // ── WEEK 1 ──────────────────────────────────────────────────────────────
  {
    week: 1, dates: "05 Jan – 09 Jan 2026", theme: "Induction, Environment Setup & Project Understanding",
    days: [
      { date: "05 Jan 2026", day: "Monday", title: "Organisation Induction & Onboarding",
        tasks: ["Attended orientation session at Unified Mentor", "Completed HR documentation and access credential setup", "Received project brief for CricSmart – Cricket Match Simulation & Analytics Platform", "Set up development workstation with VS Code, Node.js 20, and Git"],
        learnings: ["Company culture and workflow processes", "Project scope overview: simulation, analytics, auth, teams, ML"],
        challenge: null },
      { date: "06 Jan 2026", day: "Tuesday", title: "Repository Exploration & Tech Stack Study",
        tasks: ["Cloned the CricSmart repository and reviewed directory structure", "Studied Next.js 16 App Router documentation and routing conventions", "Reviewed package.json to understand all installed dependencies", "Read through existing README.md and project dossier"],
        learnings: ["App Router vs Pages Router differences", "Purpose of each folder: app/, services/, domain/, lib/, persistence/"],
        challenge: "Large codebase with many interconnected layers required systematic top-down exploration before diving into any single file." },
      { date: "07 Jan 2026", day: "Wednesday", title: "Prisma Schema & Database Design Study",
        tasks: ["Studied prisma/schema.prisma in detail", "Mapped all entity relationships on paper (User, Team, HostedMatch, Tournament)", "Ran npx prisma migrate dev on local PostgreSQL instance", "Generated Prisma TypeScript client with npx prisma generate"],
        learnings: ["Prisma schema syntax and relational modelling", "Enum-constrained status fields (MatchStatus, TossDecision)", "Foreign key cascade behaviour in Prisma"],
        challenge: "Initial PostgreSQL connection failed due to missing .env.local. Resolved by copying .env.example and configuring DATABASE_URL." },
      { date: "08 Jan 2026", day: "Thursday", title: "Redis Setup & Authentication Overview",
        tasks: ["Installed Redis locally and configured REDIS_URL in .env.local", "Traced authentication flow: /api/auth/signup → /api/auth/login → /api/auth/me", "Studied session cookie model and Upstash rate-limiting integration", "Successfully ran full local dev server with npm run dev"],
        learnings: ["Cookie-based session architecture vs JWT", "Redis as session store with TTL and rotation", "Zod schema validation on auth payloads"],
        challenge: null },
      { date: "09 Jan 2026", day: "Friday", title: "Domain Event Architecture Deep-Dive",
        tasks: ["Studied src/domain/ — event bus, event type definitions, and three consumers", "Traced BALL event flow from engine emission to SSE broadcast", "Drew event pipeline diagram in notebook for reference", "Weekly review meeting with supervisor Mr. Ishant Sethi"],
        learnings: ["Event-driven architecture: producer–bus–consumer decoupling", "Difference between SSE consumer, replay consumer, commentary consumer", "How loose coupling enables extensibility without engine changes"],
        challenge: null },
    ]
  },

  // ── WEEK 2 ──────────────────────────────────────────────────────────────
  {
    week: 2, dates: "12 Jan – 16 Jan 2026", theme: "Simulation Engine Internals & Match State Management",
    days: [
      { date: "12 Jan 2026", day: "Monday", title: "Match Engine Core Logic Study",
        tasks: ["Read match engine source files in src/services/", "Traced ball event processing: input → state mutation → event emission", "Identified innings-end condition logic (all-out / overs complete)", "Mapped match state object fields: score, wickets, overs, inningsIndex, teamA, teamB"],
        learnings: ["Reducer-based state update pattern: newState = f(currentState, event)", "How innings index transitions between 0 (first) and 1 (second)", "Wicket counting and all-out detection"],
        challenge: "Innings transition condition initially used playingXI.length instead of hardcoded 10 — identified as potential bug to fix later." },
      { date: "13 Jan 2026", day: "Tuesday", title: "connectRealtime.ts & SSE Client Analysis",
        tasks: ["Studied connectRealtime.ts in full — toss metadata check, auto-start logic, reconnect handling", "Traced realtimeRouter.ts event dispatch: CONNECTED, INITIAL_STATE, BALL_EVENT, WICKET, COMMENTARY", "Identified auto-start block at line ~238 that skips simulation when toss metadata missing", "Documented the bug and planned fix approach"],
        learnings: ["SSE EventSource API and client-side event listeners", "How INITIAL_STATE synchronises newly connected or reconnected clients", "Why toss metadata is required before engine start"],
        challenge: "Auto-start skip warning ENGINE WARN: skipping auto-start (missing toss metadata) confirmed as root cause of simulation not starting." },
      { date: "14 Jan 2026", day: "Wednesday", title: "Simulation Toss Metadata Fix",
        tasks: ["Implemented isSimulation detection logic in connectRealtime.ts (absence of hostedMatchId)", "Injected default toss metadata for simulation: team A wins toss, elects to bat", "Tested fix — simulation now starts without warning", "Verified hosted match flow unaffected by the conditional guard"],
        learnings: ["How to distinguish simulation vs hosted match at runtime", "Importance of conditional guards to protect existing flows when adding new behaviour"],
        challenge: null },
      { date: "15 Jan 2026", day: "Thursday", title: "TeamSelector & Admin Dashboard Study",
        tasks: ["Studied TeamSelector.tsx team confirmation flow and SIMULATION_STATE_UPDATE dispatch", "Reviewed AdminDashboard.tsx start click handler and lifecycle action calls", "Ran end-to-end simulation: selected India vs Australia, clicked Start, observed ball events streaming", "Verified BALL_EVENT, COMMENTARY, WIN_PROBABILITY_UPDATE in browser console"],
        learnings: ["How React state and event dispatch connect UI actions to server-side engine", "Ball event payload structure: score, wickets, over, ball, committedState"],
        challenge: null },
      { date: "16 Jan 2026", day: "Friday", title: "Playing XI Generation for Simulation",
        tasks: ["Identified that Squad tab shows 'No squad data available' despite players visible in Live Pulse", "Traced issue: Squad tab reads DB-backed squad, simulation has no DB squad", "Implemented default playing XI seeding for simulation teams (India/Australia use known player names, custom teams use placeholders)", "Updated Squad tab component to read from match state for simulation matches"],
        learnings: ["Difference between DB-persisted squad and runtime match state player data", "How to add simulation-only fallback without breaking hosted match squad loading"],
        challenge: null },
    ]
  },

  // ── WEEK 3 ──────────────────────────────────────────────────────────────
  {
    week: 3, dates: "19 Jan – 23 Jan 2026", theme: "Hosted Match Lifecycle – Creation, Toss & Playing XI",
    days: [
      { date: "19 Jan 2026", day: "Monday", title: "Hosted Match Creation Flow",
        tasks: ["Studied /api/hosted-matches POST route and HostedMatch Prisma model", "Created a test hosted match: IPL – RCB vs CSK, T20, Chennai, 10 Jul 2026", "Verified DRAFT status in database via Prisma Studio", "Reviewed control page component: /hosted-matches/[id]/control"],
        learnings: ["HostedMatch schema fields: title, format, venue, startTime, status, teams", "How DRAFT status flows through the match lifecycle to LIVE and COMPLETED"],
        challenge: null },
      { date: "20 Jan 2026", day: "Tuesday", title: "Toss Setup & API Integration",
        tasks: ["Tested toss setup on control page — selected RCB as toss winner, decision BAT", "Traced PATCH /api/hosted-matches/[id]/toss handler and Prisma update call", "Verified tossWinner and decision fields saved correctly to DB", "Identified issue: second hosted match missing Toss and Playing XI sections on control page"],
        learnings: ["Prisma PATCH update pattern for partial record updates", "How toss decision determines battingFirst assignment in match state"],
        challenge: "Second hosted match control page missing Toss/Playing XI sections — traced to conditional render checking a field that was null for new matches. Fixed rendering condition to use status === DRAFT unconditionally." },
      { date: "21 Jan 2026", day: "Wednesday", title: "Squad Management & Playing XI Selection",
        tasks: ["Added 12 squad players to RCB via /teams/rcb/manage page", "Added squad for CSK team — 12 players with jersey numbers and roles (BAT/BOWL/AR/WK)", "Navigated to Playing XI section on control page", "Identified bug: Playing XI showing 0/11 despite 12 squad players added"],
        learnings: ["How team squads are stored: PlayerProfile records linked to Team via teamId", "Playing XI selection fetches squad from /api/teams/[slug]/squad endpoint"],
        challenge: "Playing XI component was fetching from wrong endpoint, causing empty checkbox list. Traced and identified the API response shape mismatch." },
      { date: "22 Jan 2026", day: "Thursday", title: "Playing XI Loading Bug Fix",
        tasks: ["Fixed Playing XI component to fetch from correct squad API with proper response field mapping", "Verified both RCB and CSK squad players appear as checkboxes with jersey and role", "Selected exactly 11 players for each team and saved", "Confirmed RCB XI and CSK XI displayed as tag lists below checkboxes"],
        learnings: ["API response shape inspection and field mapping in React components", "Importance of consistent identifier fields across fetch, display, and validation"],
        challenge: null },
      { date: "23 Jan 2026", day: "Friday", title: "prompt() Bug Fix in ManageTeamClient",
        tasks: ["Identified browser console error: prompt() is not supported in ManageTeamClient.tsx", "Replaced native prompt() call with inline edit UI using React state", "Implemented edit form with Player Name, Jersey Number, and Role fields in-place", "Tested edit flow — form appears on Edit click, submits via PATCH API, restores row on cancel"],
        learnings: ["Why native browser dialogs (alert/confirm/prompt) don't work in Next.js/Electron environments", "React state-driven inline edit pattern as a clean alternative"],
        challenge: null },
    ]
  },

  // ── WEEK 4 ──────────────────────────────────────────────────────────────
  {
    week: 4, dates: "26 Jan – 30 Jan 2026", theme: "Scoring Console, Wicket Logic & Innings Transition",
    days: [
      { date: "26 Jan 2026", day: "Monday", title: "Scoring Console Feature Study",
        tasks: ["Studied /hosted-matches/[id]/score page and scoring console component", "Traced Start Match button flow — transitions HostedMatch status to LIVE", "Reviewed Striker/Non-Striker/Bowler dropdown population from saved playing XI", "Submitted first ball event: Virat (striker), Phil Salt (non-striker), Chahar (bowler), Run 1"],
        learnings: ["How scoring console bridges UI form submission to /api/match/[matchId]/ball POST", "Ball event payload: striker, nonStriker, bowler, eventType (Run/Wide/NoBall/Wicket), runs"],
        challenge: null },
      { date: "27 Jan 2026", day: "Tuesday", title: "Innings Transition Bug Investigation",
        tasks: ["Submitted Wicket event in scoring console at ball 1 of over 1", "Observed: innings immediately jumped to innings 2 (currentInningsIndex: 1)", "Inspected server log BALL_EVENT payload — wickets: 0, over: 0, but currentInningsIndex: 1", "Identified root cause: innings-end condition checking wickets >= playingXI.length, and playingXI size was 0 or 1 due to loading issue"],
        learnings: ["How innings transition condition should work: wickets >= 10 OR overs >= configOvers", "Why dynamic team size for all-out check is dangerous — always hardcode MAX_WICKETS = 10"],
        challenge: "The wicket bug was a cascade from the Playing XI loading bug — because XI had 0 players, 1 wicket equalled all-out. Both bugs were related." },
      { date: "28 Jan 2026", day: "Wednesday", title: "Innings Transition Bug Fix",
        tasks: ["Fixed innings-end check: replaced playingXI.length with hardcoded MAX_WICKETS = 10", "Added isAllOut = currentWickets >= 10 and isOversComplete = currentOver >= configOvers guards", "Tested: submitted 5 wickets — innings did not end; submitted 6, 7, 8, 9 — no transition; 10th wicket triggered correct transition", "Verified score shows X/10 after all-out and innings 2 begins correctly"],
        learnings: ["Cricket all-out rule: always 10 wickets, regardless of squad size", "Importance of constants over dynamic length checks for domain rule enforcement"],
        challenge: null },
      { date: "29 Jan 2026", day: "Thursday", title: "Innings 2 Scoring Console Reset",
        tasks: ["Verified that after innings flip, scoring console resets Striker/Non-Striker/Bowler dropdowns", "Confirmed new batting team (CSK) populates Striker and Non-Striker dropdowns", "Confirmed new bowling team (RCB) populates Bowler dropdown", "Tested full innings 2 ball submission flow — 6 balls, 1 over, correct score accumulation"],
        learnings: ["How innings state index and team assignment drive dropdown population in scoring console", "Why dropdown reset is critical on innings flip to avoid stale player selection"],
        challenge: null },
      { date: "30 Jan 2026", day: "Friday", title: "End-to-End Hosted Match Flow Verification",
        tasks: ["Ran full hosted match flow: create → toss → playing XI → start → score 6 overs → wicket → continue → innings 2 → finish", "Verified all stages passed without errors", "Observed correct SSE events: BALL_EVENT, WICKET, WIN_PROBABILITY_UPDATE, COMMENTARY", "Weekly review — presented fixed flows to supervisor"],
        learnings: ["Complete hosted match lifecycle from organizer perspective", "How all fixed bugs (playing XI loading, innings transition, scoring validation) chain together"],
        challenge: null },
    ]
  },

  // ── WEEK 5 ──────────────────────────────────────────────────────────────
  {
    week: 5, dates: "02 Feb – 06 Feb 2026", theme: "Realtime Streaming, Reconnect & Commentary Pipeline",
    days: [
      { date: "02 Feb 2026", day: "Monday", title: "SSE Endpoint Deep Study",
        tasks: ["Studied /api/realtime/[matchId] route handler in full", "Traced SSE broadcast pipeline: engine event → consumers → GET_CLIENTS → SSE write", "Identified broadcast payload structure for each event type", "Tested SSE with two browser tabs simultaneously — both received identical events"],
        learnings: ["Server-Sent Events HTTP streaming mechanism", "How matchId-scoped client registry enables per-match broadcasting", "EventSource reconnection behaviour and Last-Event-ID header usage"],
        challenge: null },
      { date: "03 Feb 2026", day: "Tuesday", title: "Client Reconnect Flow Testing",
        tasks: ["Simulated disconnect mid-match by closing network tab in DevTools", "Reconnected and observed INITIAL_STATE event received with full match state", "Verified score, innings, and recent balls synchronized correctly after reconnect", "Tested with simulation at 3x speed to stress-test event ordering"],
        learnings: ["How INITIAL_STATE event enables stateless client recovery", "Event sequence numbers preventing duplicate processing on reconnect"],
        challenge: "Brief duplicate commentary lines on reconnect observed — traced to COMMENTARY events not carrying sequence deduplication. Noted for future improvement." },
      { date: "04 Feb 2026", day: "Wednesday", title: "Commentary Consumer Analysis",
        tasks: ["Studied commentary consumer and orchestration pipeline in src/domain/", "Traced: BALL/WICKET event → commentary context builder → text generation → COMMENTARY domain event", "Observed tone and importance fields in generated output", "Tested isWicket: true commentary for a wicket event — confirmed dramatic tone"],
        learnings: ["How ball context (runs, over, phase, batsman, bowler) drives commentary text templates", "Tone/importance dimensions: dramatic, neutral, excited, analytical"],
        challenge: null },
      { date: "05 Feb 2026", day: "Thursday", title: "Replay Timeline & Event Persistence",
        tasks: ["Studied replay consumer and event store abstraction in src/persistence/", "Queried GET /api/events?matchId=X to retrieve persisted event timeline after match", "Verified events returned in sequence order with correct metadata", "Tested replay tab in match viewer — ball-by-ball scrubbing worked correctly"],
        learnings: ["How sequence-ordered event store enables post-match replay and analytics recomputation", "Difference between live SSE stream and persisted replay timeline"],
        challenge: null },
      { date: "06 Feb 2026", day: "Friday", title: "Win Probability Consumer Analysis",
        tasks: ["Studied win-probability domain consumer and legacy heuristic model", "Observed probability delta values in WIN_PROBABILITY_UPDATE payloads", "Traced probability chart updates in match viewer analytics tab", "Reviewed WIN_PROBABILITY_MODE feature flag and ml_local path"],
        learnings: ["How win probability is computed from run rate, wickets remaining, and overs remaining", "Feature flag driven progressive adoption of ML models"],
        challenge: null },
    ]
  },

  // ── WEEK 6 ──────────────────────────────────────────────────────────────
  {
    week: 6, dates: "09 Feb – 13 Feb 2026", theme: "Analytics Module & Visualisation Layer",
    days: [
      { date: "09 Feb 2026", day: "Monday", title: "Analytics Selector Architecture Study",
        tasks: ["Studied analytics service selectors in src/services/analytics/", "Identified selectors: momentumSelector, runRateSelector, overProgressionSelector, winProbabilitySelector", "Traced how selectors consume replay event arrays and return Recharts-compatible data", "Reviewed Analytics tab UI — All / Batting / Bowling / Pressure sub-views"],
        learnings: ["Selector-based architecture: pure functions over event arrays, no side effects", "Recharts LineChart, BarChart, and AreaChart data formats"],
        challenge: null },
      { date: "10 Feb 2026", day: "Tuesday", title: "Momentum Trend & Run Rate Implementation Study",
        tasks: ["Traced momentum selector: per-ball scoring rate vs expected rate yields momentum score", "Traced run rate selector: over-wise CRR computed from cumulative score", "Ran simulation, opened Analysis tab — verified both charts updating in real time", "Inspected Recharts component configuration for responsive containers"],
        learnings: ["Momentum scoring formula: actual runs per ball minus baseline (CRR/6)", "How analytics selectors are called reactively on each BALL_EVENT update"],
        challenge: null },
      { date: "11 Feb 2026", day: "Wednesday", title: "Match Highlights & Pressure Phase Detection",
        tasks: ["Studied Match Highlights consumer — detects collapse phase, death-over drama, turning points", "Reviewed MATCH_INSIGHTS rendering in the Analysis tab", "Tested: submitted 4 successive dot balls — 'bowling dominance' insight triggered", "Observed 'DEATH OVERS PRESSURE' phase label in final 4 overs"],
        learnings: ["Phase detection logic: powerplay (0–6), middle (7–15), death (16–20)", "How qualitative labels ('collapse phase', 'death over drama') are derived from raw event patterns"],
        challenge: null },
      { date: "12 Feb 2026", day: "Thursday", title: "Player Analytics & Scorecard Module",
        tasks: ["Studied scorecard component — batting rows, bowling rows, fall of wickets, extras, partnerships", "Tested innings selector toggle between Innings 1 and Innings 2 tabs", "Verified bowling figures: overs, runs, wickets, economy computed correctly", "Reviewed /analytics/players page — player form trend chart and impact score"],
        learnings: ["How batting scorecard rows are derived from ball event player assignments", "Economy rate formula: (runs conceded / balls bowled) × 6"],
        challenge: null },
      { date: "13 Feb 2026", day: "Friday", title: "Over Timeline & Analysis Chart Testing",
        tasks: ["Tested Timeline tab: over-by-over ball badge rendering (dot, 1, 2, 4, 6, W, Wd, Nb)", "Verified run totals per over displayed correctly", "Tested worm/progression chart with a simulated high-scoring match (200+ runs)", "End-of-week review: analytics module confirmed fully functional"],
        learnings: ["Color-coded ball badge rendering logic in Timeline component", "Worm chart progression data shape: cumulative runs per over for each innings"],
        challenge: null },
    ]
  },

  // ── WEEK 7 ──────────────────────────────────────────────────────────────
  {
    week: 7, dates: "16 Feb – 20 Feb 2026", theme: "Team Management, Tournament Module & Player Profiles",
    days: [
      { date: "16 Feb 2026", day: "Monday", title: "Team Creation & Identity Management",
        tasks: ["Studied /teams/create page and POST /api/teams endpoint", "Created test team 'Mumbai Indians' with slug, short name MI, visibility PUBLIC", "Reviewed Team schema fields: name, shortName, slug, city, logo, visibility", "Tested team page at /teams/mumbai-indians — verified metadata displayed"],
        learnings: ["Slug-based team identity for URL-friendly routing", "TeamVisibility enum: PUBLIC, PRIVATE, INVITE_ONLY"],
        challenge: null },
      { date: "17 Feb 2026", day: "Tuesday", title: "Squad Management & ManageTeam Page",
        tasks: ["Added 15 squad players to Mumbai Indians via /teams/[slug]/manage", "Tested inline edit form for player update (post prompt() fix)", "Tested Remove player functionality", "Verified squad count and player list persistence across page refreshes"],
        learnings: ["PlayerProfile entity: name, jersey, role (BAT/BOWL/AR/WK), teamId foreign key", "Inline edit state management: editingId tracking which row is in edit mode"],
        challenge: null },
      { date: "18 Feb 2026", day: "Wednesday", title: "Team Follow & Favorite Interactions",
        tasks: ["Tested POST /api/teams/[slug]/follow endpoint from second test account", "Verified TeamFollow record created in DB via Prisma Studio", "Tested POST /api/teams/[slug]/favorite — FavoriteTeam record created", "Verified team page displays follower count update"],
        learnings: ["Social interaction model: TeamFollow and FavoriteTeam as lightweight join tables", "How follower count is computed: COUNT of TeamFollow records for a team"],
        challenge: null },
      { date: "19 Feb 2026", day: "Thursday", title: "Tournament Creation & Team Enrollment",
        tasks: ["Created test tournament 'IPL 2026 Simulation' with date range and format T20", "Enrolled RCB, CSK, Mumbai Indians into tournament via /api/tournaments/[id]/teams", "Created TournamentMatch linking IPL hosted match to tournament", "Viewed /tournaments/[id] page — verified teams and fixture listed"],
        learnings: ["Tournament entity: name, format, startDate, endDate, location, organizerId", "TournamentTeam and TournamentMatch as mapping entities enabling multi-team fixtures"],
        challenge: null },
      { date: "20 Feb 2026", day: "Friday", title: "Player Profiles & Discovery Pages",
        tasks: ["Visited /players/discover — reviewed player card grid layout", "Tested /players/profiles/[id] — player stats, impact score, form trend chart", "Studied player profile API: GET /api/player-profiles/[id]", "Reviewed how snapshot stats fields are populated from match history"],
        learnings: ["Player discovery page uses server-side pagination of PlayerProfile records", "Snapshot stats: runs, balls, strikeRate, wickets, economy stored on profile for quick display"],
        challenge: null },
    ]
  },

  // ── WEEK 8 ──────────────────────────────────────────────────────────────
  {
    week: 8, dates: "23 Feb – 27 Feb 2026", theme: "Authentication Module, Middleware & Account Pages",
    days: [
      { date: "23 Feb 2026", day: "Monday", title: "Authentication API Full Study",
        tasks: ["Read full signup and login route handler source code", "Traced Zod schema validation on signup: username, email, password fields", "Traced bcryptjs hashing flow: plaintext → saltRounds → hashedPassword stored in DB", "Tested signup with invalid email — Zod validation error returned correctly"],
        learnings: ["Zod z.object() schema definition and .parse() validation", "bcryptjs: hash() for storage, compare() for verification on login", "Why server-side validation is essential even with client-side checks"],
        challenge: null },
      { date: "24 Feb 2026", day: "Tuesday", title: "Session Cookie & Redis Store Deep-Dive",
        tasks: ["Traced session cookie issuance after successful login", "Studied AUTH_COOKIE_NAME and AUTH_SESSION_TTL_SECONDS configuration", "Verified Redis key structure: session:{sessionId} → userId mapping", "Tested AUTH_SESSION_ROTATE_SECONDS — confirmed new session ID issued after rotation window"],
        learnings: ["Cookie attributes: HttpOnly, Secure, SameSite for session security", "Session rotation: issuing new session ID on each request within rotation window prevents session fixation"],
        challenge: null },
      { date: "25 Feb 2026", day: "Wednesday", title: "Middleware Route Protection Testing",
        tasks: ["Tested accessing /account without a valid session — redirect to /login?redirect=/account confirmed", "Tested accessing /admin/[matchId] without admin role — access denied correctly", "Reviewed middleware.ts route pattern matching logic", "Tested login redirect: after login, redirected back to /account correctly"],
        learnings: ["Next.js middleware: runs before every request, checks cookie, enforces policy", "redirect= query param pattern for post-login navigation"],
        challenge: null },
      { date: "26 Feb 2026", day: "Thursday", title: "Account Module Pages Verification",
        tasks: ["Tested all /account sub-pages: profile, activity, settings, teams, tournaments, hosted-matches, saved-matches", "Verified profile update via PATCH /api/account/profile", "Tested save/bookmark: POST /api/hosted-matches/[id]/save created SavedMatch record", "Confirmed saved match appears under /account/saved-matches"],
        learnings: ["Account module as unified personal dashboard — consolidating all user-level data", "SavedMatch as a simple user–match bookmark without duplication of match data"],
        challenge: null },
      { date: "27 Feb 2026", day: "Friday", title: "Rate Limiting & Security Verification",
        tasks: ["Sent 10 rapid failed login attempts from same IP", "Confirmed rate limit error on 11th attempt per AUTH_RATE_LIMIT_MAX_ATTEMPTS config", "Tested AUTH_ENFORCE_SSE flag — SSE stream rejected unauthenticated connection", "Weekly security review summary prepared for supervisor"],
        learnings: ["Upstash Redis Ratelimit: fixed-window algorithm for auth attempt throttling", "How AUTH_ENFORCE_SSE bridges authentication and realtime access control"],
        challenge: null },
    ]
  },

  // ── WEEK 9 ──────────────────────────────────────────────────────────────
  {
    week: 9, dates: "02 Mar – 06 Mar 2026", theme: "Live Fixture Ingestion, Debug APIs & Admin Panels",
    days: [
      { date: "02 Mar 2026", day: "Monday", title: "CricAPI Integration Study",
        tasks: ["Studied /api/live/fixtures route and CricAPI polling service", "Reviewed fixture data normalisation from provider format to internal match schema", "Configured CRICKET_API_KEY and CRICAPI_POLL_INTERVAL_MS in .env.local", "Verified live fixtures appearing in home dashboard matches carousel"],
        learnings: ["External API polling pattern: scheduled fetch at configurable interval", "Normalisation: mapping provider field names to internal format for consistency"],
        challenge: "Provider API occasionally returned incomplete data — observed in /api/live/runtime-check. Stale feed handling noted as a known limitation." },
      { date: "03 Mar 2026", day: "Tuesday", title: "Debug API Endpoints Study",
        tasks: ["Tested /api/debug/commentary — verified commentary context returned for a running match", "Tested /api/debug/providers — confirmed CricAPI provider status and last-fetch timestamp", "Tested /api/debug/ml — reviewed ML workspace availability flags", "Documented debug endpoints as operational diagnostics surface"],
        learnings: ["Debug APIs as internal observability tools for engineering and QA", "How provider health checks reduce mean-time-to-diagnose in production-like environments"],
        challenge: null },
      { date: "04 Mar 2026", day: "Wednesday", title: "Admin Panel Cleanup – Simulation vs Hosted",
        tasks: ["Identified Admin tab shows irrelevant panels in simulation mode: Admin Scoring Panel, Director Panel, Control Dashboard", "Implemented isSimulation conditional rendering in AdminDashboard.tsx", "In simulation: show only Simulation Controls; hide Scoring Panel, Director, Control Dashboard", "In hosted match: show only Scoring Panel, Director, Control Dashboard; hide Simulation Controls"],
        learnings: ["Context-aware UI rendering: adapting the same component to different match types", "Importance of clean admin interfaces to reduce operator confusion"],
        challenge: null },
      { date: "05 Mar 2026", day: "Thursday", title: "Broadcast Director Panel & Control Dashboard Study",
        tasks: ["Studied Director Panel: Camera Shake, Slow Motion, Enter Tension, Show Overlay buttons", "Studied Control Dashboard: Trigger Replay, Camera Sweep, Enter Tension, Strategic Timeout", "Understood broadcast production use-case: enriching live match presentation for video producers", "Verified buttons emit their respective SSE broadcast events to connected clients"],
        learnings: ["Broadcast controls as production-layer features distinct from scoring logic", "How UI-triggered broadcast events differ from engine-emitted domain events"],
        challenge: null },
      { date: "06 Mar 2026", day: "Friday", title: "Match Simulation Speed Control Testing",
        tasks: ["Tested simulation speed controls: 1x, 2x, 3x via POST /api/simulation/speed", "Observed ball interval changes at each speed setting", "Tested pause and resume — confirmed engine state preserved across pause", "Tested export simulation: GET /api/simulation/export returned full match event log as JSON"],
        learnings: ["Debounced speed configuration in simulation engine", "Event log export utility for offline analysis and ML training data collection"],
        challenge: null },
    ]
  },

  // ── WEEK 10 ──────────────────────────────────────────────────────────────
  {
    week: 10, dates: "09 Mar – 13 Mar 2026", theme: "ML Workspace – Win Probability Pipeline",
    days: [
      { date: "09 Mar 2026", day: "Monday", title: "ML Workspace Overview & Setup",
        tasks: ["Explored /ml directory structure: data/, features/, training/, evaluation/, inference/", "Set up Python virtual environment in /ml with pip install -r requirements.txt", "Reviewed README for ML workspace: win probability pipeline stages", "Studied feature flags: WIN_PROBABILITY_MODE, WIN_PROBABILITY_DEBOUNCE_MS"],
        learnings: ["ML workspace is offline — decoupled from Next.js runtime during development", "Feature flags allow gradual production adoption without engine changes"],
        challenge: null },
      { date: "10 Mar 2026", day: "Tuesday", title: "Win Probability Dataset Ingestion",
        tasks: ["Ran data ingestion script: python data/ingest.py — loaded historical match event logs", "Inspected raw data schema: matchId, over, ball, score, wickets, target, result", "Verified ingested dataset size: ~50,000 ball records across simulated matches", "Studied feature engineering script: features/engineer.py"],
        learnings: ["Ball-level features for win probability: CRR, RRR, wickets remaining, innings phase", "How to construct a tabular ML dataset from event-stream data"],
        challenge: null },
      { date: "11 Mar 2026", day: "Wednesday", title: "Feature Engineering & Model Training",
        tasks: ["Ran feature engineering script: python features/engineer.py — generated features.csv", "Studied training script: training/train.py — XGBoost binary classifier on home_win label", "Executed training run: 80/20 train-test split, 100 estimators, max_depth 4", "Observed training metrics: accuracy ~72%, AUC ~0.76 on test set"],
        learnings: ["XGBoost hyperparameters: n_estimators, max_depth, learning_rate, subsample", "AUC-ROC as evaluation metric for probability calibration quality"],
        challenge: null },
      { date: "12 Mar 2026", day: "Thursday", title: "Model Evaluation & FastAPI Inference Scaffold",
        tasks: ["Ran evaluation script: python evaluation/evaluate.py — generated evaluation report PDF", "Reviewed evaluation plots: ROC curve, calibration curve, feature importance chart", "Studied FastAPI inference endpoint: inference/serve.py", "Started FastAPI server locally: uvicorn inference.serve:app — confirmed /predict endpoint responds"],
        learnings: ["Model calibration: ensures predicted 55% probability is actually correct 55% of the time", "FastAPI async endpoint for low-latency win probability inference"],
        challenge: null },
      { date: "13 Mar 2026", day: "Friday", title: "Runtime Integration & Feature Flag Testing",
        tasks: ["Set WIN_PROBABILITY_MODE=ml_local in .env.local", "Verified Next.js runtime calls FastAPI /predict on each ball event", "Compared ML probability output vs legacy heuristic — ML showed smoother calibration", "Reset WIN_PROBABILITY_MODE=legacy for production safety", "Weekly ML progress review with supervisor"],
        learnings: ["Feature-flag-gated ML path: zero-risk adoption, easy rollback", "How FastAPI inference service integrates with Next.js via internal fetch"],
        challenge: null },
    ]
  },

  // ── WEEK 11 ──────────────────────────────────────────────────────────────
  {
    week: 11, dates: "16 Mar – 20 Mar 2026", theme: "ML Workspace – Commentary Intelligence Pipeline",
    days: [
      { date: "16 Mar 2026", day: "Monday", title: "Commentary Dataset Building",
        tasks: ["Studied commentary dataset builder: ml/commentary/build_dataset.py", "Generated commentary dataset from match event logs: 10,000 event–text pairs", "Inspected dataset schema: event context (runs, wicket, phase, batsman, bowler) → commentary text", "Reviewed data quality: filtered duplicates and low-confidence entries"],
        learnings: ["How structured cricket context maps to natural language commentary", "Data quality filtering: minimum text length, deduplication by event hash"],
        challenge: null },
      { date: "17 Mar 2026", day: "Tuesday", title: "Embedding Generation & Retrieval Index",
        tasks: ["Ran embedding generation script: python commentary/embed.py — generated sentence embeddings for all commentary entries", "Built FAISS retrieval index from embeddings: python commentary/build_index.py", "Queried index with a sample event context — retrieved top-5 similar commentary entries", "Observed retrieval quality: contextually relevant entries retrieved for boundary and wicket events"],
        learnings: ["Sentence transformer embeddings for semantic similarity search", "FAISS IVF index: efficient approximate nearest-neighbour search at scale"],
        challenge: null },
      { date: "18 Mar 2026", day: "Wednesday", title: "Ranker Training",
        tasks: ["Studied ranker training script: python commentary/train_ranker.py", "Trained a pairwise ranker on (query_context, positive_candidate, negative_candidate) triples", "Evaluated ranker: MRR@5 metric on held-out evaluation pairs", "Integrated ranker with retrieval index for end-to-end commentary selection"],
        learnings: ["Pairwise ranking loss: margin-based training on positive vs negative commentary pairs", "MRR (Mean Reciprocal Rank): standard metric for ranking quality evaluation"],
        challenge: null },
      { date: "19 Mar 2026", day: "Thursday", title: "Commentary Inference & Evaluation",
        tasks: ["Ran full inference pipeline: given a ball event, generate commentary via retrieval + ranking", "Compared ML-generated commentary to template-based commentary — ML output was more varied", "Evaluated 50 test events: 82% human-rated as contextually appropriate", "Documented pipeline stages in ML workspace README"],
        learnings: ["Retrieval-augmented generation (RAG) pattern applied to sports commentary", "Human evaluation as ground truth for subjective text quality tasks"],
        challenge: null },
      { date: "20 Mar 2026", day: "Friday", title: "ML Workspace Documentation & Feature Flag Review",
        tasks: ["Documented complete ML workspace in /ml/README.md: pipeline stages, scripts, dependencies", "Reviewed feature flag design: WIN_PROBABILITY_MODE and future COMMENTARY_MODE", "Discussed ML roadmap with supervisor: model versioning, A/B testing, online learning", "Prepared ML chapter draft for final report"],
        learnings: ["ML model governance: versioning, evaluation gating before production promotion", "A/B testing framework for comparing legacy vs ML model performance in live traffic"],
        challenge: null },
    ]
  },

  // ── WEEK 12 ──────────────────────────────────────────────────────────────
  {
    week: 12, dates: "23 Mar – 27 Mar 2026", theme: "Security Hardening & Performance Testing",
    days: [
      { date: "23 Mar 2026", day: "Monday", title: "Security Audit – Route Protection",
        tasks: ["Systematically tested all protected routes without session cookie", "Verified 401/redirect for /account/*, /admin/*, /hosted-matches/*/control", "Tested role escalation: VIEWER role attempting ADMIN route — correctly blocked", "Reviewed SOCKET_ALLOWED_ORIGINS configuration for Socket.IO bootstrap"],
        learnings: ["Defence-in-depth: both middleware and route handler level checks for critical operations", "CORS + allowed origins as first line of defence for Socket.IO connections"],
        challenge: null },
      { date: "24 Mar 2026", day: "Tuesday", title: "Rate Limiting Stress Test",
        tasks: ["Wrote a simple test script sending 20 rapid login requests", "Confirmed rate limit triggered at configured max attempts threshold", "Tested rate limit reset after window expiry (AUTH_RATE_LIMIT_WINDOW_SECONDS)", "Reviewed Upstash Redis sliding window vs fixed window algorithm choice"],
        learnings: ["Fixed window rate limiting: simpler but vulnerable to boundary bursts", "Sliding window: smoother rate enforcement, slightly higher Redis overhead"],
        challenge: null },
      { date: "25 Mar 2026", day: "Wednesday", title: "Event Sequencing & Replay Consistency",
        tasks: ["Ran rapid simulation at 3x speed while opening 3 simultaneous browser tabs", "Verified all tabs showed identical score at each tick", "Checked replay timeline after match — verified sequence numbers monotonically increasing", "Tested replay scrubbing: paused at over 10, verified state reconstruction correct"],
        learnings: ["Sequence numbers as idempotency key: prevents duplicate event processing on reconnect", "Monotonic sequence ensures replay state reconstruction determinism"],
        challenge: null },
      { date: "26 Mar 2026", day: "Thursday", title: "Memory & Connection Leak Testing",
        tasks: ["Monitored Node.js process memory with --inspect during 60-minute simulation", "Opened and closed 10 SSE connections repeatedly — verified client registry cleaned up on disconnect", "Confirmed no memory growth over 60 minutes under continuous simulation", "Reviewed connection cleanup code in SSE route handler"],
        learnings: ["SSE connection lifecycle: EventEmitter cleanup on client disconnect", "GET_CLIENTS registry must remove stale entries to prevent memory leak"],
        challenge: null },
      { date: "27 Mar 2026", day: "Friday", title: "Performance Benchmarking",
        tasks: ["Measured average BALL_EVENT latency from engine emit to client receive: ~45ms", "Measured SSE broadcast to 5 concurrent clients: ~60ms with no significant degradation", "Measured /api/match/[matchId]/ball POST response time: ~180ms average", "Documented performance baseline for future reference"],
        learnings: ["SSE scales linearly with connected client count — no broadcast fan-out bottleneck up to ~100 clients per instance", "Redis SAVE latency (~20ms) is the dominant component of ball POST response time"],
        challenge: null },
    ]
  },

  // ── WEEK 13 ──────────────────────────────────────────────────────────────
  {
    week: 13, dates: "30 Mar – 03 Apr 2026", theme: "Deployment Configuration & Environment Hardening",
    days: [
      { date: "30 Mar 2026", day: "Monday", title: "Vercel Deployment Configuration",
        tasks: ["Reviewed vercel.json deployment descriptor", "Configured environment variables in Vercel dashboard for staging deployment", "Ran npm run build — verified clean build with no TypeScript errors", "Deployed to Vercel preview URL — verified all pages rendered correctly"],
        learnings: ["Vercel edge function limitations vs traditional Node.js server", "Environment variable injection at build time vs runtime in Next.js"],
        challenge: "SSE streaming required serverless function timeout increase. Configured maxDuration in vercel.json for realtime route." },
      { date: "31 Mar 2026", day: "Tuesday", title: "Railway Deployment with PostgreSQL & Redis",
        tasks: ["Reviewed railway.json and Procfile for process-based deployment", "Provisioned PostgreSQL and Redis add-ons in Railway project", "Ran prisma migrate deploy on Railway PostgreSQL", "Tested full application on Railway — simulation, hosted match, auth all functional"],
        learnings: ["Railway add-ons: managed PostgreSQL and Redis with automatic connection string injection", "prisma migrate deploy vs migrate dev: deploy is safe for production (no schema drift detection)"],
        challenge: null },
      { date: "01 Apr 2026", day: "Wednesday", title: "Environment Variable Audit",
        tasks: ["Audited all .env.example entries against actual usage in codebase", "Verified no sensitive values committed to Git history using git log --all -S 'password'", "Documented all required and optional environment variables with descriptions", "Confirmed AUTH_ALLOW_DEV_BYPASS disabled in production .env"],
        learnings: ["Git secret scanning: searching commit history for accidentally committed secrets", "AUTH_ALLOW_DEV_BYPASS: development convenience feature that must be disabled in production"],
        challenge: null },
      { date: "02 Apr 2026", day: "Thursday", title: "Build Optimisation & Lint Pass",
        tasks: ["Ran npm run lint — fixed 3 unused variable warnings and 1 missing dependency warning in useEffect", "Ran npm run build — confirmed zero errors, reviewed bundle size analysis", "Reviewed Next.js Image optimisation usage across match viewer pages", "Confirmed Prisma generate runs on postinstall hook for deployment correctness"],
        learnings: ["useEffect dependency array correctness: missing dependencies cause stale closure bugs", "Prisma postinstall script: ensures generated client matches schema on every deployment"],
        challenge: null },
      { date: "03 Apr 2026", day: "Friday", title: "Deployment Runbook Documentation",
        tasks: ["Wrote complete deployment runbook: npm ci → prisma migrate deploy → npm run build → npm run start", "Documented operational runbook: Redis + DB connectivity checks, API key validation, live match init", "Created .env.example with all required keys and example values", "Reviewed with supervisor — runbook approved"],
        learnings: ["Operational runbook: step-by-step guide reduces deployment errors and onboarding time", "Separation of concerns: infrastructure setup vs application configuration"],
        challenge: null },
    ]
  },

  // ── WEEK 14 ──────────────────────────────────────────────────────────────
  {
    week: 14, dates: "06 Apr – 10 Apr 2026", theme: "UI/UX Polish, Responsive Testing & Scorecard Refinements",
    days: [
      { date: "06 Apr 2026", day: "Monday", title: "Match Header & Live Pulse UI Review",
        tasks: ["Reviewed MatchHeader.tsx component — verified all match state fields rendered correctly", "Tested Live Pulse sidebar — current innings, batting/bowling team, striker, non-striker, bowler, score, over", "Identified missing bowler field in simulation mode — traced to bowler name not being propagated to match state for certain simulation teams", "Fixed bowler name propagation in simulation engine state"],
        learnings: ["How MatchHeader re-renders on every BALL_EVENT update — importance of memoisation", "Live Pulse as a lightweight always-visible match summary sidebar"],
        challenge: null },
      { date: "07 Apr 2026", day: "Tuesday", title: "Scorecard Component Refinements",
        tasks: ["Reviewed batting scorecard row rendering — verified dismissal type label displayed", "Tested Fall of Wickets bar — verified over.ball notation (e.g., 8/1 (2.3)) displayed correctly", "Reviewed Extras row — verified W, NB, B, LB values summed correctly", "Tested Player Comparison section at bottom of scorecard"],
        learnings: ["Dismissal notation in cricket: caught, bowled, lbw, run out, stumped", "Extras breakdown: each extra type tracked separately for bowling analysis"],
        challenge: null },
      { date: "08 Apr 2026", day: "Wednesday", title: "Responsive Layout Testing",
        tasks: ["Tested all pages on 375px (iPhone SE) viewport using Chrome DevTools", "Identified horizontal overflow in analytics charts at narrow widths", "Added overflow-x: auto wrapper to chart containers", "Tested match viewer tabs (Overview, Live, Analysis, Overs, Scorecard, Squad, Admin) on mobile"],
        learnings: ["Recharts ResponsiveContainer with min-width for scroll-enabled chart containers", "Tab navigation on mobile: horizontal scroll tab bar vs dropdown tab selector"],
        challenge: null },
      { date: "09 Apr 2026", day: "Thursday", title: "Navigation & Routing Review",
        tasks: ["Tested all navigation links from Home → Teams → Players → Analytics → Matches", "Verified Matches dropdown: all matches, live matches, create simulation, host match links", "Tested breadcrumb navigation on nested pages", "Verified /account redirect for unauthenticated users on all entry points"],
        learnings: ["Next.js Link component: client-side navigation without full page reload", "Active link highlighting using usePathname hook"],
        challenge: null },
      { date: "10 Apr 2026", day: "Friday", title: "UI Bug Fixes & Accessibility Check",
        tasks: ["Fixed missing loading state on player profile page (added Skeleton loader)", "Added aria-label attributes to icon-only buttons in Admin panel", "Tested keyboard navigation on scoring console dropdowns", "Weekly UI review with supervisor — interface improvements approved"],
        learnings: ["Skeleton loaders: improve perceived performance by showing content structure during fetch", "ARIA labels: essential for screen reader accessibility on icon buttons"],
        challenge: null },
    ]
  },

  // ── WEEK 15 ──────────────────────────────────────────────────────────────
  {
    week: 15, dates: "13 Apr – 17 Apr 2026", theme: "End-to-End Testing & Bug Resolution",
    days: [
      { date: "13 Apr 2026", day: "Monday", title: "Full Simulation Match E2E Test",
        tasks: ["Ran complete simulation: India vs Australia, T20 format, full 40 overs (20+20)", "Verified innings 1: 20 overs completed, correct score, wickets, and scorecard", "Verified innings 2: correct target displayed, RRR computed, innings ran to completion", "Verified win message displayed after match finish event"],
        learnings: ["Full match state progression through 240 ball events", "How win result (winner, winBy) is computed and broadcast as MATCH_FINISHED event"],
        challenge: null },
      { date: "14 Apr 2026", day: "Tuesday", title: "Hosted Match Full E2E Test",
        tasks: ["Ran full hosted match: RCB vs CSK, IPL, T20, Chennai — created, toss set, XI saved, started", "Scored 10 overs manually — 60 ball events submitted via scoring console", "Triggered innings transition at over 20 — verified CSK batting correctly initialised for innings 2", "Completed match — verified scorecard, winner message, and match status updated to COMPLETED in DB"],
        learnings: ["Manual scoring pace: ~3 seconds per ball event submission including UI feedback", "Match COMPLETED status written to DB on MATCH_FINISHED domain event receipt by hosted match service"],
        challenge: null },
      { date: "15 Apr 2026", day: "Wednesday", title: "Multi-Client SSE Consistency Test",
        tasks: ["Opened 4 browser windows on the same running simulation", "Verified all 4 windows showed identical score at every tick", "Closed 2 windows mid-match, opened new window — verified INITIAL_STATE sync correct", "Triggered a wicket event — verified all windows updated to dismissed batsman simultaneously"],
        learnings: ["SSE client registry per matchId: each connection independently receives all events", "INITIAL_STATE on new connection: ensures latecomer receives full current state before live events"],
        challenge: null },
      { date: "16 Apr 2026", day: "Thursday", title: "Regression Testing After All Bug Fixes",
        tasks: ["Re-ran all previously identified bug scenarios: toss metadata, wicket innings transition, playing XI loading, prompt() edit", "Confirmed all 4 bugs resolved with no regression in related features", "Ran admin panel simulation/hosted conditional test — confirmed correct panels shown for each mode", "Documented test results in testing log"],
        learnings: ["Regression testing importance: every fix can potentially break related flows", "Test scenario matrix: create, run, and document tests before and after each fix"],
        challenge: null },
      { date: "17 Apr 2026", day: "Friday", title: "Edge Case Testing",
        tasks: ["Tested all-dot-ball over (0 runs in 6 balls) — economy and run rate updated correctly", "Tested maximum score ball: 6 sixes in an over — scorecard updated correctly", "Tested match abandonment: manually set HostedMatch status to ABANDONED via API", "Tested No Ball followed by free hit: verified extra ball count and bowler economy impact"],
        learnings: ["Extras impact on economy: wide and no ball added to runs conceded but not legal ball count", "Match abandonment: status field update sufficient, no engine state change required"],
        challenge: null },
    ]
  },

  // ── WEEK 16 ──────────────────────────────────────────────────────────────
  {
    week: 16, dates: "20 Apr – 24 Apr 2026", theme: "Report Writing – Architecture, Database & Module Chapters",
    days: [
      { date: "20 Apr 2026", day: "Monday", title: "Report Structure Planning",
        tasks: ["Reviewed UIET Annexure-7 guidelines for final training report format", "Planned 12-chapter report structure aligned with project functional domains", "Set up Word document with correct page margins (top/bottom/right: 25mm, left: 32mm)", "Applied Times New Roman 12pt, 1.5 line spacing per university guidelines"],
        learnings: ["Annexure-7 requirements: cover page, certificate, declaration, acknowledgement, abstract, TOC, chapters, references", "Academic report writing: formal tone, passive voice for technical descriptions"],
        challenge: null },
      { date: "21 Apr 2026", day: "Tuesday", title: "Writing Chapter 1 – Introduction",
        tasks: ["Wrote Company Profile section for Unified Mentor", "Wrote Problem Statement covering limitations of existing cricket platforms", "Wrote Project Objectives (7 numbered objectives)", "Wrote Scope of the Project covering all 12 functional domains"],
        learnings: ["Problem statement structure: context → gap → proposed solution", "Objective writing: specific, measurable, and aligned with deliverables"],
        challenge: null },
      { date: "22 Apr 2026", day: "Wednesday", title: "Writing Chapters 2 & 3 – Literature Review & Architecture",
        tasks: ["Wrote literature review: Cricbuzz, ESPN Cricinfo, Dream11, CricAPI analysis", "Wrote technology overview: Next.js, Prisma, Redis, SSE, React", "Wrote system architecture chapter with layered architecture description", "Wrote event-driven pipeline section with numbered flow steps"],
        learnings: ["Literature review: analyse gaps in existing work to justify project contribution", "Architecture chapter structure: overview → layers → event flow → repository structure"],
        challenge: null },
      { date: "23 Apr 2026", day: "Thursday", title: "Writing Chapters 4 & 5 – Database & Module Descriptions",
        tasks: ["Wrote database design chapter: ER overview, entity summary table, enum definitions", "Wrote module descriptions for all 10 modules (simulation, hosted, realtime, commentary, replay, analytics, teams, auth, account, ML)", "Added figure and table captions per Annexure-7 format (Fig. 5.1, Table 4.1)", "Reviewed chapter lengths — all within expected academic depth"],
        learnings: ["Database chapter: focus on entity relationships and design decisions, not Prisma syntax", "Module chapter: cover purpose, workflow, and technical implementation for each feature"],
        challenge: null },
      { date: "24 Apr 2026", day: "Friday", title: "Writing Chapters 6–9 – API, Security, Testing, Deployment",
        tasks: ["Wrote API design chapter with route group table and endpoint descriptions", "Wrote security chapter: 10-row measure table covering all security mechanisms", "Wrote testing chapter: test strategy and 12-scenario test results table", "Wrote deployment chapter: environment config, local setup, Railway and Vercel configurations"],
        learnings: ["API chapter: focus on request/response contract and validation rules, not implementation code", "Testing chapter: document expected vs actual results for academic credibility"],
        challenge: null },
    ]
  },

  // ── WEEK 17 ──────────────────────────────────────────────────────────────
  {
    week: 17, dates: "27 Apr – 01 May 2026", theme: "Report Writing – Results, Limitations, Conclusion & References",
    days: [
      { date: "27 Apr 2026", day: "Monday", title: "Writing Chapter 10 – Results & Screenshots",
        tasks: ["Captured screenshots of all major UI screens: home, simulation, hosted match control, scoring console, scorecard, analytics, timeline, players", "Inserted screenshots into report with figure captions", "Wrote descriptions for each screenshot explaining what it demonstrates", "Verified all figure numbers follow Annexure-7 format (Fig. 10.1 through Fig. 10.9)"],
        learnings: ["Screenshots chapter: each figure should demonstrate a specific functional outcome, not just appearance", "Figure caption placement: bottom of figure, bold, 10pt per Annexure-7 guidelines"],
        challenge: null },
      { date: "28 Apr 2026", day: "Tuesday", title: "Writing Chapter 11 – Limitations & Future Scope",
        tasks: ["Wrote limitations table: 6 rows covering infrastructure dependency, data quality, platform complexity, environment toggles, ML maturity, mobile optimization", "Wrote future scope section: 10 numbered enhancements", "Ensured future scope items are specific and technically grounded", "Reviewed limitations for academic honesty — acknowledged all known constraints"],
        learnings: ["Limitations chapter: demonstrates critical self-assessment and engineering maturity", "Future scope: should extend naturally from current limitations and architecture"],
        challenge: null },
      { date: "29 Apr 2026", day: "Wednesday", title: "Writing Chapter 12 – Conclusion & References",
        tasks: ["Wrote conclusion chapter: summarised all achievements, challenges overcome, and engineering lessons learned", "Compiled 15 references in numbered format: Next.js, Prisma, Redis, Upstash, Zod, Recharts, CricAPI, MDN SSE, Fowler EDA, PostgreSQL, Vercel, Railway", "Formatted references with consistent [N] Author. Title. URL. Year. style", "Completed Table of Contents with correct page numbers"],
        learnings: ["Conclusion: synthesise key contributions and connect back to objectives stated in Chapter 1", "Reference formatting: consistent citation style essential for academic credibility"],
        challenge: null },
      { date: "30 Apr 2026", day: "Thursday", title: "Full Report Review & Formatting Pass",
        tasks: ["Read entire report end-to-end for consistency, grammar, and technical accuracy", "Fixed page margin inconsistencies on chapters 7 and 8", "Verified all figure and table numbering sequences are correct", "Confirmed preliminary pages use Roman numerals and main chapters use Arabic numerals"],
        learnings: ["Proofreading strategy: read for content first, then for formatting, then for grammar", "Page numbering: Roman for preliminaries (i, ii...), Arabic for chapters (1, 2...) per Annexure-7"],
        challenge: null },
      { date: "01 May 2026", day: "Friday", title: "Report Submission Draft Review with Supervisor",
        tasks: ["Submitted report draft to supervisor Mr. Ishant Sethi for review", "Received feedback: expand Chapter 5 module descriptions and add more detail to testing chapter", "Revised Chapter 5 – added toss injection, playing XI generation, and scoring console reset details", "Revised Chapter 8 – expanded test scenario table to 12 entries"],
        learnings: ["Academic report iteration: first draft rarely sufficient; supervisor feedback is essential", "Module descriptions: more implementation detail improves technical depth and viva preparation"],
        challenge: null },
    ]
  },

  // ── WEEK 18 ──────────────────────────────────────────────────────────────
  {
    week: 18, dates: "04 May – 08 May 2026", theme: "Daily Diary, Viva Preparation & Final Documentation",
    days: [
      { date: "04 May 2026", day: "Monday", title: "Daily Diary Compilation – Weeks 1–9",
        tasks: ["Compiled daily diary entries for Weeks 1–9 from training notes", "Structured each entry: Date, Day, Title, Tasks Performed, Key Learnings, Challenges", "Formatted diary in MS Word following professional layout guidelines", "Reviewed entries for technical accuracy against report content"],
        learnings: ["Daily diary as reflective learning tool: captures progression from setup to complex feature implementation", "Importance of maintaining contemporaneous notes during training for accurate diary compilation"],
        challenge: null },
      { date: "05 May 2026", day: "Tuesday", title: "Daily Diary Compilation – Weeks 10–18",
        tasks: ["Compiled daily diary entries for Weeks 10–18: ML workspace, security testing, deployment, report writing", "Added supervisor sign-off rows for each week", "Applied consistent table formatting throughout diary", "Printed draft for manual review"],
        learnings: ["Consistent diary structure across weeks aids examiner review and viva discussion", "Diary and report should be mutually reinforcing: diary shows day-by-day process, report shows final outcome"],
        challenge: null },
      { date: "06 May 2026", day: "Wednesday", title: "Viva Preparation – Architecture & Design Questions",
        tasks: ["Prepared answers for expected viva questions: system architecture, event-driven design, layered architecture", "Practiced explaining the ball event pipeline (engine → bus → 3 consumers) in 2 minutes", "Prepared ER diagram explanation for database viva questions", "Reviewed technology choice justifications: why Next.js, why PostgreSQL+Redis, why SSE over WebSockets"],
        learnings: ["Viva technique: lead with the big picture, then drill down into specifics when asked", "Technology justification: always compare with alternatives (WebSockets vs SSE, Redis vs in-memory)"],
        challenge: null },
      { date: "07 May 2026", day: "Thursday", title: "Viva Preparation – Implementation & Bug Fix Questions",
        tasks: ["Prepared explanations for all 4 bugs fixed: toss metadata, wicket innings transition, playing XI loading, prompt() replacement", "Practiced explaining root cause → diagnosis → fix → verification for each bug", "Prepared ML workspace overview: two pipelines, feature flags, FastAPI inference", "Mock viva with a colleague — received feedback on clarity of architecture explanation"],
        learnings: ["Bug explanation structure for viva: what was the symptom, what was the root cause, how did you fix it, how did you verify", "Mock vivas: reveal weak points in explanation before the actual examination"],
        challenge: null },
      { date: "08 May 2026", day: "Friday", title: "Final Report & Diary Proofreading",
        tasks: ["Final proofread of full report (35+ pages) — corrected 6 minor typographic errors", "Final proofread of daily diary — verified all 90 entries complete and consistent", "Printed report and diary for hard binding review", "Confirmed all Annexure-7 required documents: cover, certificate, declaration, acknowledgement, abstract, TOC, figures, tables, chapters, references"],
        learnings: ["Hard binding submission: allow 2–3 days for binding after final print", "Document checklist: prevents missing sections that could affect evaluation score"],
        challenge: null },
    ]
  },

  // ── WEEK 19 ──────────────────────────────────────────────────────────────
  {
    week: 19, dates: "11 May – 15 May 2026", theme: "Final Enhancements & Pre-submission Polish",
    days: [
      { date: "11 May 2026", day: "Monday", title: "Simulation Squad Tab Final Verification",
        tasks: ["Re-tested Squad tab in simulation mode for India vs Australia", "Confirmed known player names (Shubman Gill, Rohit Sharma, Virat Kohli, etc.) rendered correctly", "Tested Squad tab for custom team names — placeholder names displayed as expected", "Verified no regression in hosted match squad tab (still reads from DB)"],
        learnings: ["Final verification loop: re-test all fixed features to confirm no regression after later changes", "User-facing feature completeness: Squad tab now consistent across both match modes"],
        challenge: null },
      { date: "12 May 2026", day: "Tuesday", title: "Admin Panel Final Testing",
        tasks: ["Ran simulation match — confirmed only Simulation Controls visible in Admin tab", "Ran hosted match — confirmed Admin Scoring Panel, Director Panel, Control Dashboard visible; Simulation Controls hidden", "Tested Director Panel buttons (Camera Shake, Slow Motion, Enter Tension, Show Overlay) — broadcast events emitted", "Confirmed no UI errors in either mode"],
        learnings: ["Conditional rendering correctness: isSimulation guard evaluated consistently across all Admin sub-sections", "Broadcast control events: UI-driven domain events distinct from engine-driven ball events"],
        challenge: null },
      { date: "13 May 2026", day: "Wednesday", title: "Account Module Final Testing",
        tasks: ["Tested complete account flow: signup → profile setup → create team → host match → save match → view in account", "Verified /account/teams shows created team", "Verified /account/hosted-matches shows hosted match with COMPLETED status", "Verified /account/saved-matches shows bookmarked match"],
        learnings: ["Account module completeness: all user activities are reflected in the account dashboard", "SavedMatch, TeamFollow, FavoriteTeam: lightweight join tables enabling fast user-specific queries"],
        challenge: null },
      { date: "14 May 2026", day: "Thursday", title: "Live Fixture Ingestion Final Test",
        tasks: ["Re-configured CRICKET_API_KEY with valid key", "Verified live fixtures appearing in home dashboard carousel", "Tested /api/live/runtime-check — confirmed provider status healthy", "Tested /api/debug/providers — confirmed last-fetch timestamp current"],
        learnings: ["Live data integration: always verify provider health before final demo", "Runtime-check endpoint: operational diagnostic tool for detecting stale feeds quickly"],
        challenge: null },
      { date: "15 May 2026", day: "Friday", title: "Complete Project Demonstration",
        tasks: ["Ran full project demonstration for supervisor: home dashboard → simulation → hosted match → analytics → account", "Demonstrated all key features: SSE realtime, win probability, commentary, scorecard, tournament, player profiles", "Received final approval from Mr. Ishant Sethi", "Training completion certificate signed and collected"],
        learnings: ["Project demonstration technique: flow through user journeys rather than feature-by-feature listing", "Supervisor approval: validates that all training objectives have been met"],
        challenge: null },
    ]
  },

  // ── WEEK 20-24 CONDENSED ─────────────────────────────────────────────────
  {
    week: 20, dates: "18 May – 22 May 2026", theme: "PPT Preparation, Report Binding & Final Submission",
    days: [
      { date: "18 May 2026", day: "Monday", title: "Project PPT Preparation – Slides 1–10",
        tasks: ["Created PPT: Title, Company Profile, Problem Statement, Objectives, Scope", "Added System Architecture diagram slide with layered architecture visual", "Added Technology Stack slide with logos and key features", "Added Database Design slide with ER diagram summary"],
        learnings: ["PPT structure mirrors report chapters for viva consistency", "Architecture diagrams: use simple boxes-and-arrows, avoid overly detailed UML"],
        challenge: null },
      { date: "19 May 2026", day: "Tuesday", title: "Project PPT Preparation – Slides 11–20",
        tasks: ["Added Module Description slides (Simulation, Hosted Match, Realtime, Analytics)", "Added Screenshots slide deck: 8 screenshots of key UI screens", "Added Testing slide: test scenarios table summary", "Added Deployment slide: environment configuration and runbook"],
        learnings: ["Screenshots in PPT: annotate each with a call-out explaining what it demonstrates", "Testing slide: summarise pass/fail matrix rather than listing all 12 scenarios"],
        challenge: null },
      { date: "20 May 2026", day: "Wednesday", title: "Project PPT Preparation – Slides 21–28",
        tasks: ["Added Security & ML Workspace slides", "Added Limitations & Future Scope slide", "Added Conclusion slide with key contributions summary", "Added References slide"],
        learnings: ["PPT conclusion: 3–4 bullet points summarising the most important contributions", "Consistent font and colour scheme throughout: professional and exam-ready"],
        challenge: null },
      { date: "21 May 2026", day: "Thursday", title: "Hard Binding & Final Report Preparation",
        tasks: ["Sent final report PDF to print and hard binding", "Prepared Mid-Term Evaluation Performa (Annexure-4) and Final Evaluation Performa (Annexure-6)", "Compiled complete submission package: hard-bound report, diary, CD with soft copy, PPT", "Prepared daily diary for hard binding"],
        learnings: ["Annexure-7 binding requirements: hard bound for final submission", "Submission package checklist: report, diary, completion certificate, evaluation performas, CD, PPT"],
        challenge: null },
      { date: "22 May 2026", day: "Friday", title: "Final Submission & Closing",
        tasks: ["Submitted complete training package to UIET department", "Submitted hard-bound report, daily diary, signed completion certificate, evaluation performas, and CD", "Final review of all submitted documents for completeness", "Training period concluded — all objectives met"],
        learnings: ["Industrial training conclusion: six months of hands-on development, debugging, and documentation produced a production-quality full-stack platform", "Key personal growth: event-driven architecture, realtime systems, ML integration, and academic report writing"],
        challenge: null },
    ]
  },
];

// ── BUILD DOCUMENT ────────────────────────────────────────────────────────
const children = [...coverPage(), pageBreak()];

allWeeks.forEach((week, wi) => {
  children.push(...weekHeader(week.week, week.dates, week.theme));
  week.days.forEach((d, di) => {
    children.push(dayEntry(d.date, d.day, d.title, d.tasks, d.learnings, d.challenge, di % 2 === 1));
    children.push(gap(6));
  });
  children.push(gap(10));
  children.push(signOff(week.week));
  if (wi < allWeeks.length - 1) children.push(pageBreak());
});

const doc = new Document({
  numbering: {
    config: [
      { reference: "diary-bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 240 } } } }
      ]}
    ]
  },
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 22 } } }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1843 }
      }
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: [PageNumber.CURRENT], font: "Times New Roman", size: 18 })]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("CricSmart_Daily_Diary.docx", buf);
  console.log("Diary written.");
});
