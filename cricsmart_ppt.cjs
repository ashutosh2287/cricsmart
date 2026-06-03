const PptxGenJS = require('pptxgenjs');

const pres = new PptxGenJS();
pres.layout = 'LAYOUT_16x9';
pres.title = 'CricSmart – Cricket Match Simulation & Analytics Platform';
pres.author = 'Ashutosh Anand';

// PALETTE
const C = {
  darkBg:   '0A1628',  // deep navy (title/section slides)
  green:    '1B7A3E',  // cricket green
  greenL:   '2ECC71',  // light green accent
  gold:     'F4C430',  // gold accent
  white:    'FFFFFF',
  offwhite: 'F2F6FA',
  lightBg:  'F2F6FA',  // light content slides
  gray:     '5A6A7A',
  darkText: '1A2740',
  cardBg:   'FFFFFF',
  teal:     '0D7A6B',
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function darkSlide(slide) {
  slide.background = { color: C.darkBg };
}
function lightSlide(slide) {
  slide.background = { color: C.lightBg };
}

// Cricket ball SVG as base64 PNG substitute — we'll use a circle motif instead
function addGreenAccentCircle(slide, x, y, w) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w, h: w,
    fill: { color: C.green, transparency: 85 },
    line: { color: C.green, width: 1.5, transparency: 60 },
  });
}

function addCard(slide, x, y, w, h, color, radius) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color: color || C.cardBg },
    line: { color: 'E0E8F0', width: 0.5 },
    shadow: { type: 'outer', blur: 8, offset: 2, angle: 135, color: '000000', opacity: 0.08 },
    rectRadius: radius || 0.12,
  });
}

function sectionBadge(slide, label, x, y) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w: 2.2, h: 0.32,
    fill: { color: C.green },
    line: { color: C.green, width: 0 },
    rectRadius: 0.16,
  });
  slide.addText(label.toUpperCase(), {
    x, y, w: 2.2, h: 0.32,
    fontSize: 8, bold: true, color: C.white,
    align: 'center', valign: 'middle', margin: 0,
  });
}

function pageTitle(slide, text, light) {
  slide.addText(text, {
    x: 0.5, y: 0.3, w: 9, h: 0.65,
    fontSize: 30, bold: true,
    color: light ? C.darkText : C.white,
    fontFace: 'Trebuchet MS',
    align: 'left', valign: 'middle', margin: 0,
  });
}

// ── SLIDE 1 – TITLE ──────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  // Background decorative circles
  addGreenAccentCircle(s, 7.5, -0.5, 4.5);
  addGreenAccentCircle(s, -1.2, 3.5, 3.5);

  // Green left accent strip
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.08, h: 5.625,
    fill: { color: C.greenL }, line: { color: C.greenL, width: 0 },
  });

  // Cricket ball icon (circle + seam)
  s.addShape(pres.shapes.OVAL, {
    x: 0.5, y: 1.5, w: 0.55, h: 0.55,
    fill: { color: C.green }, line: { color: C.greenL, width: 2 },
  });

  // Main title
  s.addText('CricSmart', {
    x: 1.3, y: 1.35, w: 7.5, h: 0.85,
    fontSize: 52, bold: true, color: C.white,
    fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  s.addText('Cricket Match Simulation & Analytics Platform', {
    x: 1.3, y: 2.2, w: 8, h: 0.45,
    fontSize: 18, bold: false, color: C.greenL,
    fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, {
    x: 1.3, y: 2.75, w: 5.5, h: 0.04,
    fill: { color: C.gold }, line: { color: C.gold, width: 0 },
  });

  // Details
  s.addText([
    { text: 'Ashutosh Anand  |  Roll No. SG22310', options: { breakLine: true } },
    { text: 'B.E. Computer Science & Engineering', options: { breakLine: true } },
    { text: 'UIET, Panjab University SSG Regional Centre, Hoshiarpur', options: { breakLine: true } },
    { text: 'Industrial Training at Unified Mentor, Gurugram  |  Jan – May 2026', options: {} },
  ], {
    x: 1.3, y: 2.95, w: 8.2, h: 1.4,
    fontSize: 13, color: 'A8BDD4',
    fontFace: 'Calibri', align: 'left', margin: 0,
  });

  // Supervisor
  s.addText('Supervisor: Mr. Ishant Sethi, Unified Mentor', {
    x: 1.3, y: 4.7, w: 8, h: 0.35,
    fontSize: 11, color: C.gold, fontFace: 'Calibri', align: 'left', margin: 0,
  });
}

// ── SLIDE 2 – COMPANY PROFILE ────────────────────────────────────────────────
{
  const s = pres.addSlide();
  lightSlide(s);

  sectionBadge(s, 'CHAPTER 1', 0.5, 0.15);
  pageTitle(s, 'Company Profile – Unified Mentor', true);

  // Left column: about
  addCard(s, 0.5, 1.1, 4.5, 3.8, C.white);

  s.addText('About Unified Mentor', {
    x: 0.65, y: 1.25, w: 4.2, h: 0.35,
    fontSize: 14, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText('A technology-driven IT organization based in Gurugram, India, focused on modern software solutions and practical industry training. Bridges the gap between academic learning and real-world software engineering.', {
    x: 0.65, y: 1.65, w: 4.2, h: 1.0,
    fontSize: 12, color: C.gray, fontFace: 'Calibri', margin: 0,
  });

  s.addText('Key Services', {
    x: 0.65, y: 2.75, w: 4.2, h: 0.3,
    fontSize: 13, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
  });
  const services = ['Full-Stack Web Application Development', 'Software Design & System Architecture', 'Data Analytics & Visualization', 'API Development & Integration', 'Technical Training & Mentorship'];
  services.forEach((svc, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 0.65, y: 3.1 + i * 0.32, w: 0.09, h: 0.09,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });
    s.addText(svc, {
      x: 0.82, y: 3.05 + i * 0.32, w: 4.1, h: 0.28,
      fontSize: 11, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
  });

  // Right column: philosophy + training details
  addCard(s, 5.2, 1.1, 4.3, 1.8, C.darkBg);
  s.addText('Philosophy', {
    x: 5.35, y: 1.2, w: 4.0, h: 0.3,
    fontSize: 13, bold: true, color: C.gold, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText('"Industry-oriented training in modern technologies — web development, cloud computing, and data analytics — with a focus on practical, project-based learning."', {
    x: 5.35, y: 1.55, w: 4.0, h: 1.15,
    fontSize: 11, color: 'A8BDD4', italic: true, fontFace: 'Calibri', margin: 0,
  });

  addCard(s, 5.2, 3.05, 4.3, 1.85, C.white);
  s.addText('Training Details', {
    x: 5.35, y: 3.15, w: 4.0, h: 0.3,
    fontSize: 13, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
  });
  const details = [
    ['Trainee', 'Ashutosh Anand'],
    ['Roll No.', 'SG22310'],
    ['Duration', 'Jan 2026 – May 2026'],
    ['Supervisor', 'Mr. Ishant Sethi'],
  ];
  details.forEach(([k, v], i) => {
    s.addText(k + ':', {
      x: 5.35, y: 3.55 + i * 0.32, w: 1.3, h: 0.28,
      fontSize: 11, bold: true, color: C.green, fontFace: 'Calibri', margin: 0,
    });
    s.addText(v, {
      x: 6.7, y: 3.55 + i * 0.32, w: 2.7, h: 0.28,
      fontSize: 11, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 3 – PROBLEM STATEMENT & OBJECTIVES ─────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  addGreenAccentCircle(s, 8.2, -0.8, 3.5);

  sectionBadge(s, 'CHAPTER 2', 0.5, 0.15);
  pageTitle(s, 'Problem Statement & Objectives', false);

  // Left: Problem
  addCard(s, 0.5, 1.15, 4.5, 4.0, '12213A');
  s.addText('The Gap in Cricket Platforms', {
    x: 0.65, y: 1.3, w: 4.2, h: 0.35,
    fontSize: 14, bold: true, color: C.gold, fontFace: 'Trebuchet MS', margin: 0,
  });
  const problems = [
    'Existing platforms offer static scorecards with no interactivity',
    'No unified platform for simulation + analytics + hosting',
    'No community/campus match hosting with live scoring',
    'No extensible ML layer for win probability & commentary',
    'Fragmented tools addressing only one aspect at a time',
  ];
  problems.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.65, y: 1.78 + i * 0.58, w: 0.05, h: 0.38,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });
    s.addText(p, {
      x: 0.82, y: 1.78 + i * 0.58, w: 4.1, h: 0.45,
      fontSize: 11, color: 'C8D8E8', fontFace: 'Calibri', margin: 0,
    });
  });

  // Right: Objectives
  addCard(s, 5.2, 1.15, 4.3, 4.0, '12213A');
  s.addText('Project Objectives', {
    x: 5.35, y: 1.3, w: 4.0, h: 0.35,
    fontSize: 14, bold: true, color: C.greenL, fontFace: 'Trebuchet MS', margin: 0,
  });
  const objs = [
    'Robust ball-by-ball cricket simulation engine',
    'Real-time SSE streaming with reconnect safety',
    'Replay, commentary & analytics from event streams',
    'Hosted match lifecycle for community matches',
    'Role-aware security & route access control',
    'Extensible ML workspace with feature flags',
    'Polished real-time UI with match analytics',
  ];
  objs.forEach((o, i) => {
    s.addText(String(i + 1), {
      x: 5.35, y: 1.72 + i * 0.48, w: 0.3, h: 0.3,
      fontSize: 11, bold: true, color: C.gold,
      fontFace: 'Trebuchet MS', align: 'center', margin: 0,
    });
    s.addText(o, {
      x: 5.7, y: 1.72 + i * 0.48, w: 3.7, h: 0.42,
      fontSize: 10.5, color: 'C8D8E8', fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 4 – SYSTEM ARCHITECTURE ────────────────────────────────────────────
{
  const s = pres.addSlide();
  lightSlide(s);

  sectionBadge(s, 'CHAPTER 4', 0.5, 0.15);
  pageTitle(s, 'System Architecture', true);

  // Architecture diagram: layered boxes
  const layers = [
    { label: 'Presentation Layer', sub: 'Next.js 16 App Router · React 19 · Tailwind CSS 4 · Recharts', col: 'DBEAFE', border: '3B82F6' },
    { label: 'API Layer', sub: 'Route Handlers (src/app/api/*) · Custom Node.js server/index.ts', col: 'DCFCE7', border: C.green },
    { label: 'Service & Domain Layer', sub: 'Match Engine · Analytics Selectors · Commentary · Auth · Event Bus', col: 'FEF9C3', border: 'EAB308' },
    { label: 'Persistence Layer', sub: 'PostgreSQL via Prisma ORM · Redis (sessions, runtime state)', col: 'FFE4E6', border: 'F43F5E' },
    { label: 'External Integrations', sub: 'CricAPI · Upstash Redis Rate-Limiting · FastAPI ML Inference', col: 'F3E8FF', border: 'A855F7' },
  ];

  layers.forEach((l, i) => {
    addCard(s, 0.5, 1.1 + i * 0.84, 5.8, 0.76, l.col);
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.5, y: 1.1 + i * 0.84, w: 0.07, h: 0.76,
      fill: { color: l.border }, line: { color: l.border, width: 0 },
    });
    s.addText(l.label, {
      x: 0.72, y: 1.15 + i * 0.84, w: 5.5, h: 0.28,
      fontSize: 13, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
    });
    s.addText(l.sub, {
      x: 0.72, y: 1.44 + i * 0.84, w: 5.5, h: 0.28,
      fontSize: 10, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
  });

  // Arrows between layers
  for (let i = 0; i < 4; i++) {
    s.addShape(pres.shapes.LINE, {
      x: 3.1, y: 1.86 + i * 0.84, w: 0, h: 0.08,
      line: { color: C.gray, width: 1 },
    });
  }

  // Right: Event-driven pipeline
  addCard(s, 6.55, 1.1, 3.0, 4.2, C.darkBg);
  s.addText('Event Pipeline', {
    x: 6.7, y: 1.2, w: 2.7, h: 0.3,
    fontSize: 13, bold: true, color: C.gold, fontFace: 'Trebuchet MS', margin: 0,
  });

  const pipe = [
    { icon: '⚙', label: 'Match Engine', sub: 'Emits typed domain events' },
    { icon: '🔀', label: 'Event Bus', sub: 'Routes to 3 consumers' },
    { icon: '📡', label: 'SSE Consumer', sub: 'Broadcasts to browser clients' },
    { icon: '📼', label: 'Replay Consumer', sub: 'Persists timeline' },
    { icon: '🎙', label: 'Commentary', sub: 'Generates narration' },
  ];
  pipe.forEach((p, i) => {
    if (i > 0) {
      s.addShape(pres.shapes.LINE, {
        x: 7.15, y: 1.6 + i * 0.68, w: 0, h: 0.1,
        line: { color: C.greenL, width: 1 },
      });
    }
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 6.7, y: 1.7 + i * 0.68, w: 2.7, h: 0.52,
      fill: { color: i === 0 ? C.green : (i === 1 ? '1A3050' : '162840') },
      line: { color: i === 0 ? C.greenL : '2A4060', width: 0.5 },
      rectRadius: 0.08,
    });
    s.addText(p.label, {
      x: 6.85, y: 1.73 + i * 0.68, w: 2.5, h: 0.22,
      fontSize: 11, bold: true, color: C.white, fontFace: 'Calibri', margin: 0,
    });
    s.addText(p.sub, {
      x: 6.85, y: 1.95 + i * 0.68, w: 2.5, h: 0.2,
      fontSize: 9, color: 'A0B8CC', fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 5 – TECHNOLOGY STACK ────────────────────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  addGreenAccentCircle(s, -0.8, -0.8, 3.5);

  sectionBadge(s, 'CHAPTER 3', 0.5, 0.15);
  pageTitle(s, 'Technology Stack', false);

  const techs = [
    { name: 'Next.js 16', cat: 'Frontend & API', desc: 'App Router, SSR, API routes — unified fullstack framework', col: '0070F3' },
    { name: 'React 19', cat: 'UI', desc: 'Component model with concurrent rendering features', col: '61DAFB' },
    { name: 'TypeScript', cat: 'Language', desc: 'Type-safe codebase across frontend & backend', col: '3178C6' },
    { name: 'Tailwind CSS 4', cat: 'Styling', desc: 'Utility-first styling with minimal configuration', col: '38BDF8' },
    { name: 'PostgreSQL', cat: 'Database', desc: 'Relational persistence via Prisma ORM (type-safe queries)', col: '336791' },
    { name: 'Redis', cat: 'State Cache', desc: 'Session storage, runtime match state, Upstash rate-limiting', col: 'DC382D' },
    { name: 'Server-Sent Events', cat: 'Realtime', desc: 'Unidirectional HTTP streaming — auto-reconnectable', col: C.green },
    { name: 'FastAPI + XGBoost', cat: 'ML Inference', desc: 'Win probability pipeline with feature-flag gated adoption', col: '009688' },
    { name: 'Recharts', cat: 'Analytics UI', desc: 'Responsive charts for momentum, run rate, win probability', col: 'FF6B6B' },
  ];

  // 3x3 grid
  techs.forEach((t, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.4 + col * 3.15;
    const y = 1.1 + row * 1.45;

    addCard(s, x, y, 2.95, 1.25, '12213A');
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.95, h: 0.06,
      fill: { color: t.col }, line: { color: t.col, width: 0 },
    });
    s.addText(t.name, {
      x: x + 0.12, y: y + 0.12, w: 2.7, h: 0.28,
      fontSize: 12, bold: true, color: C.white, fontFace: 'Trebuchet MS', margin: 0,
    });
    s.addText(t.cat.toUpperCase(), {
      x: x + 0.12, y: y + 0.42, w: 2.7, h: 0.2,
      fontSize: 8, bold: true, color: t.col, fontFace: 'Calibri', margin: 0,
    });
    s.addText(t.desc, {
      x: x + 0.12, y: y + 0.62, w: 2.7, h: 0.55,
      fontSize: 9.5, color: 'A0B8CC', fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 6 – DATABASE DESIGN ─────────────────────────────────────────────────
{
  const s = pres.addSlide();
  lightSlide(s);

  sectionBadge(s, 'CHAPTER 4', 0.5, 0.15);
  pageTitle(s, 'Database Design', true);

  // Entity table
  const entities = [
    ['User', 'Identity, hashed credentials, role, owned teams & hosted matches'],
    ['Team', 'Name, slug, visibility, city, logo, owner, followers, squad'],
    ['TeamMember', 'User–Team mapping with role (OWNER/ADMIN/PLAYER/ANALYST)'],
    ['PlayerProfile', 'Name, jersey, role (BAT/BOWL/AR/WK), snapshot stats'],
    ['HostedMatch', 'Title, format, venue, status, tossWinner, battingFirst, XI'],
    ['Tournament', 'Organizer-owned: name, format, startDate, endDate, location'],
    ['SavedMatch', 'User bookmark linking user → hosted match'],
  ];

  // Header
  addCard(s, 0.5, 1.05, 6.5, 0.38, C.green);
  s.addText('Entity', {
    x: 0.6, y: 1.08, w: 1.6, h: 0.3,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Calibri', margin: 0,
  });
  s.addText('Description', {
    x: 2.2, y: 1.08, w: 4.7, h: 0.3,
    fontSize: 11, bold: true, color: C.white, fontFace: 'Calibri', margin: 0,
  });

  entities.forEach((e, i) => {
    addCard(s, 0.5, 1.43 + i * 0.47, 6.5, 0.42, i % 2 === 0 ? C.white : 'EBF5EE');
    s.addText(e[0], {
      x: 0.6, y: 1.49 + i * 0.47, w: 1.6, h: 0.3,
      fontSize: 11, bold: true, color: C.green, fontFace: 'Calibri', margin: 0,
    });
    s.addText(e[1], {
      x: 2.2, y: 1.49 + i * 0.47, w: 4.7, h: 0.3,
      fontSize: 11, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
  });

  // Right: Enums
  addCard(s, 7.2, 1.05, 2.3, 4.35, C.darkBg);
  s.addText('Enums', {
    x: 7.35, y: 1.15, w: 2.0, h: 0.3,
    fontSize: 13, bold: true, color: C.gold, fontFace: 'Trebuchet MS', margin: 0,
  });
  const enums = [
    ['MatchStatus', 'DRAFT · SCHEDULED\nLIVE · COMPLETED\nABANDONED'],
    ['TossDecision', 'BAT · BOWL'],
    ['TeamVisibility', 'PUBLIC · PRIVATE\nINVITE_ONLY'],
    ['MemberRole', 'OWNER · ADMIN\nPLAYER · ANALYST\nVIEWER'],
  ];
  enums.forEach((e, i) => {
    s.addText(e[0], {
      x: 7.35, y: 1.55 + i * 0.95, w: 2.0, h: 0.28,
      fontSize: 10, bold: true, color: C.greenL, fontFace: 'Calibri', margin: 0,
    });
    s.addText(e[1], {
      x: 7.35, y: 1.83 + i * 0.95, w: 2.0, h: 0.55,
      fontSize: 9, color: 'A0B8CC', fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 7 – KEY MODULES ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  addGreenAccentCircle(s, 8.5, 3.5, 3.5);

  sectionBadge(s, 'CHAPTER 5', 0.5, 0.15);
  pageTitle(s, 'Key Modules & Implementation', false);

  const modules = [
    { n: 'Match Simulation', i: '01', desc: 'Auto-generates ball-by-ball events. Toss injection, speed controls (1x/2x/3x), pause/resume, playing XI seeding for known teams.', col: C.green },
    { n: 'Hosted Match', i: '02', desc: 'Full lifecycle: DRAFT → toss setup → playing XI → LIVE scoring console → COMPLETED. Manual ball entry with striker/bowler validation.', col: '1565C0' },
    { n: 'Realtime Streaming', i: '03', desc: 'SSE endpoint /api/realtime/[matchId]. Broadcasts BALL_EVENT, WICKET, WIN_PROBABILITY, COMMENTARY, MATCH_FINISHED. INITIAL_STATE on reconnect.', col: '6A1B9A' },
    { n: 'Analytics', i: '04', desc: 'Momentum trend, run rate progression, over worm chart, win probability curve, bowling economy, match highlights & phase detection.', col: 'E65100' },
    { n: 'ML Workspace', i: '05', desc: 'Win probability (XGBoost + FastAPI). Commentary intelligence (FAISS + ranker). Feature flags for zero-risk production adoption.', col: '00695C' },
    { n: 'Auth & Account', i: '06', desc: 'bcryptjs + Zod validation. Redis session with TTL/rotation. Middleware route gating. Account dashboard: teams, matches, tournaments.', col: 'B71C1C' },
  ];

  modules.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 4.85;
    const y = 1.1 + row * 1.48;

    addCard(s, x, y, 4.65, 1.3, '12213A');
    // Color left bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: 1.3,
      fill: { color: m.col }, line: { color: m.col, width: 0 },
    });
    // Number badge
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15, y: y + 0.12, w: 0.38, h: 0.28,
      fill: { color: m.col }, line: { color: m.col, width: 0 },
      rectRadius: 0.06,
    });
    s.addText(m.i, {
      x: x + 0.15, y: y + 0.12, w: 0.38, h: 0.28,
      fontSize: 9, bold: true, color: C.white,
      align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(m.n, {
      x: x + 0.6, y: y + 0.1, w: 3.95, h: 0.32,
      fontSize: 13, bold: true, color: C.white, fontFace: 'Trebuchet MS', margin: 0,
    });
    s.addText(m.desc, {
      x: x + 0.15, y: y + 0.48, w: 4.4, h: 0.72,
      fontSize: 10, color: 'A0B8CC', fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 8 – REALTIME & SSE ARCHITECTURE ────────────────────────────────────
{
  const s = pres.addSlide();
  lightSlide(s);

  sectionBadge(s, 'CHAPTER 5.3', 0.5, 0.15);
  pageTitle(s, 'Realtime Streaming Architecture', true);

  // Left: Event types
  addCard(s, 0.5, 1.1, 3.9, 4.1, C.white);
  s.addText('SSE Event Types Broadcast', {
    x: 0.65, y: 1.22, w: 3.6, h: 0.32,
    fontSize: 13, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
  });

  const events = [
    { name: 'BALL_EVENT', desc: 'Full match state: score, wickets, over, ball, innings context', col: C.green },
    { name: 'WICKET', desc: 'Dismissal details: batsman, kind (caught/bowled/lbw)', col: 'F43F5E' },
    { name: 'WIN_PROBABILITY_UPDATE', desc: 'Home/away probability values with delta', col: '8B5CF6' },
    { name: 'COMMENTARY', desc: 'Text with tone (dramatic/neutral), isBoundary, isWicket flags', col: '0EA5E9' },
    { name: 'MATCH_FINISHED', desc: 'Final state with winner and win-by details', col: C.gold },
    { name: 'INITIAL_STATE', desc: 'Full snapshot for new/reconnecting clients', col: '64748B' },
  ];

  events.forEach((e, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.65, y: 1.65 + i * 0.57, w: 3.65, h: 0.48,
      fill: { color: e.col + '18' },
      line: { color: e.col, width: 0.8 },
      rectRadius: 0.06,
    });
    s.addText(e.name, {
      x: 0.75, y: 1.68 + i * 0.57, w: 3.5, h: 0.2,
      fontSize: 10, bold: true, color: e.col, fontFace: 'Calibri', margin: 0,
    });
    s.addText(e.desc, {
      x: 0.75, y: 1.88 + i * 0.57, w: 3.5, h: 0.2,
      fontSize: 9, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
  });

  // Right: Reconnect flow + performance stats
  addCard(s, 4.6, 1.1, 4.95, 2.0, C.darkBg);
  s.addText('Reconnect Flow', {
    x: 4.75, y: 1.2, w: 4.65, h: 0.3,
    fontSize: 13, bold: true, color: C.gold, fontFace: 'Trebuchet MS', margin: 0,
  });
  const steps = ['Client disconnects mid-match', 'EventSource auto-reconnects via HTTP', 'Server sends INITIAL_STATE with full match snapshot', 'Client re-syncs score, innings, commentary', 'Live events resume seamlessly'];
  steps.forEach((st, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 4.75, y: 1.62 + i * 0.27, w: 0.18, h: 0.18,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });
    s.addText(st, {
      x: 5.02, y: 1.58 + i * 0.27, w: 4.4, h: 0.25,
      fontSize: 10, color: 'C8D8E8', fontFace: 'Calibri', margin: 0,
    });
  });

  // Performance stats
  addCard(s, 4.6, 3.25, 4.95, 1.95, C.white);
  s.addText('Performance Benchmarks', {
    x: 4.75, y: 3.35, w: 4.65, h: 0.3,
    fontSize: 13, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
  });
  const stats = [
    ['BALL_EVENT Latency', '~45 ms (engine emit → client)'],
    ['SSE Broadcast (5 clients)', '~60 ms — no fan-out bottleneck'],
    ['Ball POST Response', '~180 ms average'],
    ['Redis SAVE Latency', '~20 ms (dominant component)'],
  ];
  stats.forEach(([k, v], i) => {
    s.addText(k + ':', {
      x: 4.75, y: 3.73 + i * 0.35, w: 2.3, h: 0.28,
      fontSize: 10, bold: true, color: C.green, fontFace: 'Calibri', margin: 0,
    });
    s.addText(v, {
      x: 7.1, y: 3.73 + i * 0.35, w: 2.35, h: 0.28,
      fontSize: 10, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 9 – ML WORKSPACE ────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  addGreenAccentCircle(s, 7.5, 3.5, 4.0);

  sectionBadge(s, 'CHAPTER 5.10', 0.5, 0.15);
  pageTitle(s, 'ML Workspace & Integration', false);

  // Two pipelines
  const pipelines = [
    {
      title: 'Win Probability Pipeline',
      col: C.teal,
      steps: ['Dataset ingestion from match event logs (~50K ball records)', 'Feature engineering: CRR, RRR, wickets remaining, innings phase', 'XGBoost model training (Accuracy ~72%, AUC ~0.76)', 'FastAPI /predict endpoint for low-latency inference', 'Feature flag: WIN_PROBABILITY_MODE=ml_local'],
    },
    {
      title: 'Commentary Intelligence Pipeline',
      col: '7C3AED',
      steps: ['Commentary dataset: 10K event–text pairs from match logs', 'Sentence transformer embeddings for semantic similarity', 'FAISS retrieval index — approximate nearest-neighbour search', 'Pairwise ranker training (MRR@5 evaluation)', '82% human-rated contextually appropriate (50 test events)'],
    },
  ];

  pipelines.forEach((p, pi) => {
    const x = 0.4 + pi * 4.85;
    addCard(s, x, 1.1, 4.6, 4.1, '12213A');
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 4.6, h: 0.06,
      fill: { color: p.col }, line: { color: p.col, width: 0 },
    });
    s.addText(p.title, {
      x: x + 0.12, y: 1.2, w: 4.35, h: 0.38,
      fontSize: 13, bold: true, color: C.white, fontFace: 'Trebuchet MS', margin: 0,
    });
    p.steps.forEach((st, si) => {
      // Step number
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.15, y: 1.7 + si * 0.65, w: 0.28, h: 0.28,
        fill: { color: p.col }, line: { color: p.col, width: 0 },
      });
      s.addText(String(si + 1), {
        x: x + 0.15, y: 1.7 + si * 0.65, w: 0.28, h: 0.28,
        fontSize: 9, bold: true, color: C.white,
        align: 'center', valign: 'middle', margin: 0,
      });
      // Connector line
      if (si < p.steps.length - 1) {
        s.addShape(pres.shapes.LINE, {
          x: x + 0.29, y: 1.98 + si * 0.65, w: 0, h: 0.37,
          line: { color: p.col, width: 1.5 },
        });
      }
      s.addText(st, {
        x: x + 0.52, y: 1.68 + si * 0.65, w: 3.95, h: 0.52,
        fontSize: 10.5, color: 'C8D8E8', fontFace: 'Calibri', margin: 0,
      });
    });
  });

  // Feature flags note
  s.addText('Feature Flags: WIN_PROBABILITY_MODE (legacy | ml_local) — zero-risk gradual adoption', {
    x: 0.5, y: 5.25, w: 9, h: 0.25,
    fontSize: 10, color: C.gold, italic: true, fontFace: 'Calibri',
    align: 'center', margin: 0,
  });
}

// ── SLIDE 10 – SECURITY & RELIABILITY ────────────────────────────────────────
{
  const s = pres.addSlide();
  lightSlide(s);

  sectionBadge(s, 'CHAPTER 7', 0.5, 0.15);
  pageTitle(s, 'Security & Reliability', true);

  const measures = [
    { m: 'Password Security', d: 'bcryptjs hashing with configurable salt rounds — never stored plaintext', col: 'F43F5E' },
    { m: 'Payload Validation', d: 'Zod schema validation on all API endpoints; invalid payloads → 400', col: 'EF4444' },
    { m: 'Session Security', d: 'Redis sessions with configurable TTL & automatic rotation prevents fixation', col: 'F97316' },
    { m: 'Rate Limiting', d: 'Upstash Redis: fixed-window throttle (configurable max attempts/window)', col: 'EAB308' },
    { m: 'Route Access Control', d: 'Middleware: Public / Authenticated / Creator / Admin per URL pattern', col: C.green },
    { m: 'Role-Based Checks', d: 'Team/HostedMatch/Tournament operations verify OWNER/ADMIN before writes', col: '0EA5E9' },
    { m: 'SSE Security', d: 'AUTH_ENFORCE_SSE flag requires valid session for realtime stream', col: '8B5CF6' },
    { m: 'Event Sequencing', d: 'Monotonic sequence numbers — prevents duplication under reconnects', col: '6366F1' },
  ];

  // 2-column layout
  measures.forEach((m, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.4 + col * 4.85;
    const y = 1.1 + row * 1.08;

    addCard(s, x, y, 4.65, 0.95, C.white);
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.12, y: y + 0.35, w: 0.12, h: 0.12,
      fill: { color: m.col }, line: { color: m.col, width: 0 },
    });
    s.addText(m.m, {
      x: x + 0.35, y: y + 0.1, w: 4.2, h: 0.3,
      fontSize: 12, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
    });
    s.addText(m.d, {
      x: x + 0.12, y: y + 0.44, w: 4.4, h: 0.42,
      fontSize: 10, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.35, y: y + 0.39, w: 2.0, h: 0.03,
      fill: { color: m.col + '40' }, line: { color: m.col + '40', width: 0 },
    });
  });
}

// ── SLIDE 11 – TESTING ────────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  sectionBadge(s, 'CHAPTER 8', 0.5, 0.15);
  pageTitle(s, 'Testing Results', false);

  const tests = [
    ['Simulation Start', 'India vs Australia → Engine starts, BALL_EVENT within 1s', 'PASS'],
    ['Innings Auto-Progression', '120 balls (20 overs) → Innings transitions automatically', 'PASS'],
    ['10 Wickets Handling', '10 wicket events → Innings ends, team switches correctly', 'PASS'],
    ['SSE Reconnect', 'Disconnect + reconnect → INITIAL_STATE received, score in sync', 'PASS'],
    ['Hosted Match Toss', 'Toss winner RCB, decision BAT → Saved to DB, reflected on control page', 'PASS'],
    ['Playing XI Validation', 'Invalid striker → 400 error "Striker must belong to batting XI"', 'PASS'],
    ['Win Probability Chart', 'After each ball → WIN_PROBABILITY_UPDATE event broadcast', 'PASS'],
    ['Commentary Generation', 'WICKET event → COMMENTARY broadcast with isWicket:true', 'PASS'],
    ['Auth Route Protection', '/account without session → Redirect to /login', 'PASS'],
    ['Rate Limiting', '10 failed login attempts → Rate limit error on 11th', 'PASS'],
    ['Replay Timeline', 'After match ends → Sequence-ordered events returned', 'PASS'],
    ['Multi-Client Sync', '4 browser tabs simultaneously → Identical score at every tick', 'PASS'],
  ];

  // Header row
  addCard(s, 0.4, 1.05, 9.2, 0.38, C.green);
  ['Test Case', 'Description', 'Result'].forEach((h, i) => {
    const ws = [2.2, 6.0, 0.85];
    const xs = [0.55, 2.8, 8.9];
    s.addText(h, {
      x: xs[i], y: 1.1, w: ws[i], h: 0.28,
      fontSize: 10, bold: true, color: C.white, fontFace: 'Calibri', margin: 0,
    });
  });

  tests.forEach((t, i) => {
    addCard(s, 0.4, 1.43 + i * 0.34, 9.2, 0.3, i % 2 === 0 ? '12213A' : '0F1A2A');
    s.addText(t[0], {
      x: 0.55, y: 1.48 + i * 0.34, w: 2.2, h: 0.22,
      fontSize: 9.5, bold: true, color: C.greenL, fontFace: 'Calibri', margin: 0,
    });
    s.addText(t[1], {
      x: 2.8, y: 1.48 + i * 0.34, w: 6.0, h: 0.22,
      fontSize: 9.5, color: 'C8D8E8', fontFace: 'Calibri', margin: 0,
    });
    // PASS badge
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 8.88, y: 1.48 + i * 0.34, w: 0.62, h: 0.22,
      fill: { color: '166534' }, line: { color: C.greenL, width: 0.5 },
      rectRadius: 0.05,
    });
    s.addText('PASS', {
      x: 8.88, y: 1.48 + i * 0.34, w: 0.62, h: 0.22,
      fontSize: 8, bold: true, color: C.greenL,
      align: 'center', valign: 'middle', margin: 0,
    });
  });
}

// ── SLIDE 12 – BUGS FIXED ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  lightSlide(s);

  sectionBadge(s, 'KEY CHALLENGES', 0.5, 0.15);
  pageTitle(s, 'Bugs Identified & Fixed', true);

  const bugs = [
    {
      n: '01', title: 'Simulation Auto-Start Skip',
      sym: 'ENGINE WARN: skipping auto-start (missing toss metadata)',
      root: 'Simulation had no hostedMatchId, so toss metadata was never set, blocking engine start.',
      fix: 'Detected isSimulation mode and injected default toss metadata (Team A wins toss, elects to bat) before auto-start check.',
      col: C.green,
    },
    {
      n: '02', title: 'Premature Innings Transition',
      sym: 'First wicket triggered innings flip — currentInningsIndex jumped to 1 immediately',
      root: 'Innings-end check used playingXI.length (which was 0/1 due to loading bug) instead of hardcoded 10.',
      fix: 'Replaced dynamic length check with MAX_WICKETS = 10 constant. Verified: 9 wickets ≠ all-out; 10th wicket triggers correct transition.',
      col: 'E53935',
    },
    {
      n: '03', title: 'Playing XI Loading Bug',
      sym: 'Playing XI showing 0/11 despite 12 squad players being added',
      root: 'Component fetched from wrong API endpoint causing response shape mismatch — empty checkbox list.',
      fix: 'Fixed endpoint URL and field mapping in React component. Verified both teams\' players appear as selectable checkboxes.',
      col: '1565C0',
    },
    {
      n: '04', title: 'prompt() Not Supported',
      sym: 'Browser console error: prompt() is not supported in ManageTeamClient.tsx',
      root: 'Native browser dialog APIs (alert/confirm/prompt) don\'t work in Next.js/Electron environments.',
      fix: 'Replaced with React state-driven inline edit form with name, jersey, and role fields. Full CRUD without native dialogs.',
      col: '6A1B9A',
    },
  ];

  bugs.forEach((b, i) => {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const x = 0.4 + col * 4.85;
    const y = 1.1 + row * 2.2;

    addCard(s, x, y, 4.65, 2.05, C.white);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: 2.05,
      fill: { color: b.col }, line: { color: b.col, width: 0 },
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15, y: y + 0.08, w: 0.3, h: 0.25,
      fill: { color: b.col }, line: { color: b.col, width: 0 },
      rectRadius: 0.06,
    });
    s.addText(b.n, {
      x: x + 0.15, y: y + 0.08, w: 0.3, h: 0.25,
      fontSize: 9, bold: true, color: C.white,
      align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(b.title, {
      x: x + 0.55, y: y + 0.08, w: 4.0, h: 0.28,
      fontSize: 12, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
    });
    s.addText('Symptom: ' + b.sym, {
      x: x + 0.15, y: y + 0.42, w: 4.4, h: 0.42,
      fontSize: 9.5, color: C.gray, italic: true, fontFace: 'Calibri', margin: 0,
    });
    s.addText('Root Cause: ' + b.root, {
      x: x + 0.15, y: y + 0.88, w: 4.4, h: 0.48,
      fontSize: 9.5, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.15, y: y + 1.42, w: 0.45, h: 0.2,
      fill: { color: b.col + '20' }, line: { color: b.col, width: 0.5 }, rectRadius: 0.05,
    });
    s.addText('FIX', {
      x: x + 0.15, y: y + 1.42, w: 0.45, h: 0.2,
      fontSize: 8, bold: true, color: b.col, align: 'center', valign: 'middle', margin: 0,
    });
    s.addText(b.fix, {
      x: x + 0.68, y: y + 1.42, w: 3.87, h: 0.52,
      fontSize: 9.5, color: b.col, fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 13 – DEPLOYMENT ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  addGreenAccentCircle(s, -0.5, 4.0, 3.0);

  sectionBadge(s, 'CHAPTER 9', 0.5, 0.15);
  pageTitle(s, 'Deployment & Configuration', false);

  // Left: platforms
  const platforms = [
    { name: 'Vercel', desc: 'Frontend-managed deployment. Environment variable injection. SSE requires maxDuration config for streaming routes.', col: C.white },
    { name: 'Railway', desc: 'Process-based hosting with managed PostgreSQL & Redis add-ons. Automatic connection string injection. Full-stack.', col: C.greenL },
    { name: 'Self-Hosted', desc: 'npm run build → npm run start. Custom server/index.ts bootstraps Node.js with SSE pipeline.', col: C.gold },
  ];
  platforms.forEach((p, i) => {
    addCard(s, 0.4, 1.1 + i * 1.45, 3.9, 1.25, '12213A');
    s.addShape(pres.shapes.OVAL, {
      x: 0.55, y: 1.22 + i * 1.45, w: 0.3, h: 0.3,
      fill: { color: p.col + '30' }, line: { color: p.col, width: 1.5 },
    });
    s.addText(p.name, {
      x: 0.95, y: 1.2 + i * 1.45, w: 3.2, h: 0.32,
      fontSize: 14, bold: true, color: p.col, fontFace: 'Trebuchet MS', margin: 0,
    });
    s.addText(p.desc, {
      x: 0.55, y: 1.58 + i * 1.45, w: 3.65, h: 0.65,
      fontSize: 10.5, color: 'A0B8CC', fontFace: 'Calibri', margin: 0,
    });
  });

  // Right: Env vars + setup steps
  addCard(s, 4.5, 1.1, 5.05, 2.1, '12213A');
  s.addText('Key Environment Variables', {
    x: 4.65, y: 1.2, w: 4.75, h: 0.3,
    fontSize: 13, bold: true, color: C.gold, fontFace: 'Trebuchet MS', margin: 0,
  });
  const envs = ['DATABASE_URL · REDIS_URL', 'CRICKET_API_KEY · CRICAPI_POLL_INTERVAL_MS', 'AUTH_COOKIE_NAME · AUTH_SESSION_TTL_SECONDS', 'AUTH_RATE_LIMIT_WINDOW_SECONDS · MAX_ATTEMPTS', 'WIN_PROBABILITY_MODE · NEXT_PUBLIC_BASE_URL'];
  envs.forEach((e, i) => {
    s.addText('•', { x: 4.65, y: 1.6 + i * 0.3, w: 0.2, h: 0.25, fontSize: 12, color: C.green, margin: 0 });
    s.addText(e, { x: 4.85, y: 1.6 + i * 0.25, w: 4.55, h: 0.26, fontSize: 10, color: 'C8D8E8', fontFace: 'Calibri', margin: 0 });
  });

  addCard(s, 4.5, 3.35, 5.05, 1.95, '12213A');
  s.addText('Local Setup Steps', {
    x: 4.65, y: 3.45, w: 4.75, h: 0.3,
    fontSize: 13, bold: true, color: C.greenL, fontFace: 'Trebuchet MS', margin: 0,
  });
  const steps = ['npm ci  (Prisma client auto-generated)', 'cp .env.example .env.local  (configure vars)', 'npx prisma migrate dev  (apply migrations)', 'npm run dev  (tsx server/index.ts)'];
  steps.forEach((st, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 4.65, y: 3.85 + i * 0.33, w: 4.75, h: 0.27,
      fill: { color: '0A1628' }, line: { color: C.green + '50', width: 0.5 }, rectRadius: 0.04,
    });
    s.addText(st, {
      x: 4.75, y: 3.87 + i * 0.33, w: 4.55, h: 0.23,
      fontSize: 10, color: C.greenL, fontFace: 'Consolas', margin: 0,
    });
  });
}

// ── SLIDE 14 – LIMITATIONS & FUTURE SCOPE ────────────────────────────────────
{
  const s = pres.addSlide();
  lightSlide(s);

  sectionBadge(s, 'CHAPTER 11', 0.5, 0.15);
  pageTitle(s, 'Limitations & Future Scope', true);

  // Left: Limitations
  addCard(s, 0.4, 1.1, 4.65, 4.1, C.white);
  s.addText('Current Limitations', {
    x: 0.55, y: 1.22, w: 4.35, h: 0.32,
    fontSize: 14, bold: true, color: C.darkText, fontFace: 'Trebuchet MS', margin: 0,
  });
  const lims = [
    { t: 'Infrastructure', d: 'Requires both PostgreSQL & Redis for full runtime' },
    { t: 'External Data Quality', d: 'CricAPI provider stability affects live fixtures' },
    { t: 'Platform Complexity', d: 'Broad feature surface increases maintenance overhead' },
    { t: 'Feature Flag Sensitivity', d: 'Misconfigured rollout flags can cause silent degradation' },
    { t: 'ML Maturity', d: 'Heuristic legacy model used in default configuration' },
    { t: 'Mobile Optimization', d: 'Analytics charts require horizontal scrolling on narrow screens' },
  ];
  lims.forEach((l, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y: 1.65 + i * 0.57, w: 0.05, h: 0.4,
      fill: { color: 'E53935' }, line: { color: 'E53935', width: 0 },
    });
    s.addText(l.t + ':', {
      x: 0.72, y: 1.65 + i * 0.57, w: 1.6, h: 0.25,
      fontSize: 11, bold: true, color: C.darkText, fontFace: 'Calibri', margin: 0,
    });
    s.addText(l.d, {
      x: 0.72, y: 1.9 + i * 0.57, w: 4.2, h: 0.28,
      fontSize: 10.5, color: C.gray, fontFace: 'Calibri', margin: 0,
    });
  });

  // Right: Future Scope
  addCard(s, 5.25, 1.1, 4.3, 4.1, C.darkBg);
  s.addText('Future Enhancement Roadmap', {
    x: 5.4, y: 1.2, w: 4.0, h: 0.35,
    fontSize: 13, bold: true, color: C.gold, fontFace: 'Trebuchet MS', margin: 0,
  });
  const future = [
    'AI-assisted commentary (fine-tuned LLM)',
    'ML model versioning & A/B testing framework',
    'Tournament analytics (points table forecasting)',
    'PWA support + push notifications for live fans',
    'Multiplayer scoring with conflict resolution',
    'Cloud Kubernetes deployment with auto-scaling',
    'Advanced observability dashboards',
    'Historical ball-by-ball match archive',
  ];
  future.forEach((f, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.4, y: 1.68 + i * 0.44, w: 0.18, h: 0.18,
      fill: { color: C.gold + '30' }, line: { color: C.gold, width: 1 },
    });
    s.addText(f, {
      x: 5.65, y: 1.65 + i * 0.44, w: 3.8, h: 0.38,
      fontSize: 10.5, color: 'C8D8E8', fontFace: 'Calibri', margin: 0,
    });
  });
}

// ── SLIDE 15 – CONCLUSION ─────────────────────────────────────────────────────
{
  const s = pres.addSlide();
  darkSlide(s);

  addGreenAccentCircle(s, 7.0, -0.5, 5.0);
  addGreenAccentCircle(s, -1.5, 3.0, 4.0);

  // Green left bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.08, h: 5.625,
    fill: { color: C.greenL }, line: { color: C.greenL, width: 0 },
  });

  s.addText('CHAPTER 12', {
    x: 0.5, y: 0.4, w: 3.0, h: 0.28,
    fontSize: 10, bold: true, color: C.gold, fontFace: 'Calibri',
    align: 'left', margin: 0,
  });

  s.addText('Conclusion', {
    x: 0.5, y: 0.72, w: 9, h: 0.65,
    fontSize: 36, bold: true, color: C.white,
    fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.42, w: 4.0, h: 0.04,
    fill: { color: C.gold }, line: { color: C.gold, width: 0 },
  });

  const achievements = [
    { icon: '⚡', text: 'Simulation engine with correct cricket rules (runs, wickets, extras, innings transitions)' },
    { icon: '📡', text: 'SSE realtime pipeline with low-latency broadcast and reconnect safety' },
    { icon: '🏏', text: 'Full hosted match lifecycle from DRAFT to COMPLETED for community organizers' },
    { icon: '📊', text: 'Analytics layer: momentum, win probability, run rate, and match highlights' },
    { icon: '🔐', text: 'Secure multi-user platform: bcryptjs, Redis sessions, role-based middleware' },
    { icon: '🤖', text: 'ML workspace with feature-flagged XGBoost win probability + commentary RAG pipeline' },
  ];

  achievements.forEach((a, i) => {
    addCard(s, i < 3 ? 0.5 : 5.2, 1.6 + (i % 3) * 1.28, 4.5, 1.1, '0F1E35');
    s.addText(a.text, {
      x: (i < 3 ? 0.65 : 5.35), y: 1.72 + (i % 3) * 1.28, w: 4.2, h: 0.75,
      fontSize: 11.5, color: 'C8D8E8', fontFace: 'Calibri', margin: 0,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: (i < 3 ? 0.5 : 5.2), y: 1.6 + (i % 3) * 1.28, w: 4.5, h: 0.04,
      fill: { color: C.green }, line: { color: C.green, width: 0 },
    });
  });

  // Footer
  s.addText('Ashutosh Anand  |  SG22310  |  B.E. CSE  |  UIET Panjab University, Hoshiarpur  |  2026', {
    x: 0.5, y: 5.2, w: 9, h: 0.25,
    fontSize: 9.5, color: '5A7A9A', fontFace: 'Calibri',
    align: 'center', margin: 0,
  });
}

// ── SAVE ──────────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: 'CricSmart_Presentation.pptx' })
  .then(() => console.log('DONE: CricSmart_Presentation.pptx'))
  .catch(e => { console.error(e); process.exit(1); });
