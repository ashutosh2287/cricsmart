# CricSmart — Complete UX Audit Report

**Auditor:** MiMoCode UX Analysis Engine
**Date:** June 27, 2026
**Codebase Analyzed:** Full source (100+ components, 35+ pages, CSS design system)

---

## Executive Summary

| Dimension | Score |
|---|---|
| **Overall UX** | **5.5 / 10** |
| Visual Design | 6.5 / 10 |
| Usability | 5 / 10 |
| Accessibility | 3.5 / 10 |
| Information Hierarchy | 5 / 10 |
| Consistency | 5 / 10 |
| Sports Analytics Feel | 5.5 / 10 |
| AI Product Feel | 4 / 10 |

**Verdict:** CricSmart currently sits between a **college final-year project** and a **startup MVP**. The design token system and CSS architecture are surprisingly mature, but component-level execution is deeply inconsistent, many pages are skeleton-level stubs, and the product does not yet communicate the premium AI cricket intelligence positioning it aspires to.

---

## Global Issues

| # | Issue | Severity | Heuristic | Recommendation |
|---|---|---|---|---|
| G1 | **Two competing card class systems** — `.card-cinematic` / `.card-cinematic-static` coexist alongside the `<Card>` component which uses inline styles. Different pages use different approaches. | Critical | Consistency & Standards | Consolidate into a single `<Card>` component that absorbs cinematic styling via props. |
| G2 | **Three navbar implementations** — `src/components/layout/Navbar.tsx` (sticky two-bar nav), `src/components/Navbar.tsx` (separate file), and the landing page has its own inline `<nav>`. | Critical | Consistency & Standards | Merge into one `<AppNavbar>` with a `variant` prop (`landing` / `app`). |
| G3 | **Hardcoded Tailwind color classes mixed with CSS variables** — e.g. `border-zinc-800` in `LiveScoreCard.tsx` and `PlayerCard.tsx` but `border-[var(--border)]` elsewhere. Light mode breaks immediately. | High | Error Prevention | Replace all raw Tailwind color classes with design token references. Add lint rule. |
| G4 | **Fragile 5-second polling everywhere** — `HomePageClient`, `MatchesPage`, and `Navbar` all poll `/api/matches` independently at different intervals (5s, 30s, 60s). No shared fetch layer, no SSE/WebSocket for real data. | High | Visibility of System Status | Unify into a single `useMatches()` hook with SSE or a shared SWR/React-Query cache. |
| G5 | **No loading skeleton standard** — Some pages use `<Skeleton>` component, others use raw `animate-pulse` divs, others show nothing. | Medium | Visibility of System Status | Adopt `<Skeleton>` universally with `variant="card" | "chart" | "text"`. |
| G6 | **Emoji used as iconography** — 🏏 🏃 ⚠ ⚡ 🔥 scattered through `MatchInsightPanel`, `MatchCard`, `LiveCommentaryFeed`. Breaks professional tone. | Medium | Aesthetic & Minimalist Design | Replace with Lucide icons (already in deps). |
| G7 | **Inline styles coexist with Tailwind classes** — `Button.tsx` uses full inline CSS, `Card.tsx` uses inline `style={{}}`, while other components use Tailwind. | Medium | Consistency & Standards | Pick one approach per component type. Prefer Tailwind classes with token references. |
| G8 | **`typescript.ignoreBuildErrors: true`** in `next.config.ts` — masks type errors in production. | High | Error Prevention | Fix underlying type issues and remove the flag. |
| G9 | **No focus-visible ring on many interactive elements** — buttons in `MatchCard`, quick actions, and nav links lack visible focus indicators. | High | Accessibility | Add `focus-visible:ring-2 focus-visible:ring-[var(--brand)]` universally. |
| G10 | **No skip-to-content link** — keyboard users must tab through the entire navbar on every page load. | High | Accessibility | Add `<a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>` in root layout. |

---

## 1. Landing Page Audit

**File:** `src/components/landing/LandingPageClient.tsx` (337 lines)

### What Works
- Clean hero section with parallax scroll effect (`useTransform`)
- Gradient text and glow badge create initial premium impression
- `StatCounter` with animated count-up is a good pattern
- Feature cards use proper `group-hover` transitions

### Critical Issues

| # | Problem | Heuristic | Impact |
|---|---|---|---|
| L1 | **Hero has no visual proof** — Just text and gradient mesh. No screenshot, mockup, or preview of the actual product. Competing platforms show live dashboards in the hero. | Match Between System & Real World | Users cannot evaluate the product before signing up. Conversion drops. |
| L2 | **Footer is nearly empty** — Only logo and one line of text. No links, no social proof, no legal, no sitemap. | Consistency & Standards | Feels unfinished. Destroys trust for a "premium" product. |
| L3 | **Feature cards are generic** — "Real-Time Analytics", "AI Predictions", "Player Rankings" are feature-list items, not demonstrated capabilities. Every competitor says the same thing. | Aesthetic & Minimalist Design | Fails to differentiate CricSmart from Cricbuzz or ESPN. |
| L4 | **CTA section gradient is heavy** — The CTA box at the bottom uses a triple-gradient background with a cyan border overlay. Visually noisy for what should be a simple conversion moment. | Aesthetic & Minimalist Design | Reduces readability of the call-to-action text. |
| L5 | **Live match ticker shows only team names** — No scores, no status, no run rate. Just "Team A vs Team B" with a pulsing dot. | Visibility of System Status | Users cannot gauge match excitement from the ticker alone. |
| L6 | **Stats section uses hardcoded "500+" and "94%"** — While matches/teams pull from Prisma, the player count and accuracy are fabricated. | Error Prevention | Undermines credibility if discovered. |

### Medium Issues

- **Nav links use `#features` / `#stats` hash anchors** — no smooth scroll CSS is defined, so clicks may jump abruptly.
- **Mobile hamburger menu** opens into a `glass` panel but has no backdrop, making it hard to dismiss on touch devices.
- **No social proof** — no testimonials, no user count, no "trusted by" logos, no press mentions.
- **No product preview or interactive demo** — a carousel or embedded mini-dashboard would dramatically improve conversion.

### Redesign Recommendation

**Before:** Text-only hero → generic features → fabricated stats → CTA → empty footer
**After:** Hero with embedded product screenshot/video → interactive feature demos (e.g. live win probability widget) → real platform stats → testimonials → comprehensive footer with sitemap/social/legal

---

## 2. Dashboard (Home) Audit

**File:** `src/components/home/HomePageClient.tsx` (335 lines)

### What Works
- Welcome hero personalized with username and avatar
- Live match cards pull real API data
- Quick actions provide shortcuts to key workflows
- Stat overview gives at-a-glance platform metrics

### Critical Issues

| # | Problem | Heuristic | Impact |
|---|---|---|---|
| D1 | **No persistent sidebar** — The "dashboard" is just a vertically stacked page with `max-w-5xl`. There is no sidebar navigation, no widget grid, no persistent panels. | Recognition Rather Recall | This does not feel like a dashboard — it is a simple feed. Users expect customizable widget layouts. |
| D2 | **Create form inline with welcome hero** — "New Simulation" toggles an inline form that pushes all content down. This is not a dashboard pattern. | Aesthetic & Minimalist Design | Makes the page feel like a form builder, not an analytics dashboard. |
| D3 | **"Your Simulations" section uses status badges with "DONE" and "SOON"** — Non-standard labels. Users expect "Completed" and "Upcoming". | Match Between System & Real World | Creates unnecessary cognitive load. |
| D4 | **Two separate data sources for matches** — `fetch("/api/matches")` for simulations AND `fetch("/api/live/fixtures")` for real matches, polled at different rates. The live match section renders from the fixture API while "Your Simulations" uses the match API. | Consistency & Standards | Data can be out of sync. Two identical-looking sections show different data. |
| D5 | **Quick Actions grid uses color-coded icons** (cyan, green, amber, purple) but the color mapping is arbitrary — "Host Match" is cyan, "Tournaments" is amber, "Saved Items" is purple. No semantic meaning. | Aesthetic & Minimalist Design | Color noise without purpose. |

### Medium Issues

- Empty states are too minimal — "No live matches right now. Check back soon." should include a CTA to create or browse matches.
- The welcome hero section wastes horizontal space on mobile (avatar + text + two buttons crammed into one row).
- No recent activity feed, no AI-generated insights, no personalized recommendations.
- No dark/light mode toggle visible (exists in navbar but not prominent on dashboard).

### Redesign Recommendation

**Before:** Stacked card feed with inline form
**After:** Two-column layout (sidebar nav + main content area) with widget grid: Live Matches widget (persistent), AI Insights widget, Quick Actions row, Recent Activity feed, Win Probability highlights

---

## 3. Navigation Audit

**Files:** `src/components/layout/Navbar.tsx` (617 lines), `src/components/navigation/AppDrawer.tsx` (287 lines)

### Architecture
The app uses a **two-tier navigation** system:
1. **Top navbar** (sticky) — Logo, 4 quick links, Matches dropdown, user actions
2. **Match strip** (secondary bar below navbar) — Match previews and filter tabs
3. **Mobile drawer** — Full sidebar with 4 sections, 20+ items

### Critical Issues

| # | Problem | Heuristic | Impact |
|---|---|---|---|
| N1 | **Drawer has 20+ navigation items across 4 sections** — This is a content management system's IA, not a sports app. Cricbuzz uses a simple bottom tab bar. Sofascore uses 5 tabs. | Aesthetic & Minimalist Design | Overwhelming. Users cannot find what they need quickly. |
| N2 | **Many drawer links lead to non-existent pages** — `/live-matches`, `/live-scores`, `/schedule`, `/series`, `/stats-center`, `/records`, `/venues`, `/highlights`, `/photos`, `/auction-tracker` — these routes have no `page.tsx`. | Error Prevention | Clicking these produces 404 errors, destroying user trust. |
| N3 | **The "Matches" button appears TWICE in the top nav** — Once as a text link in the `quickLinks` row, once as the dropdown trigger. They do different things. | Consistency & Standards | Users cannot predict what clicking "Matches" will do. |
| N4 | **Secondary match strip bar is redundant** — It duplicates information from the Matches dropdown. Two UI surfaces for the same data. | Aesthetic & Minimalist Design | Wastes 44px of vertical space on every page. |
| N5 | **No search functionality** — Despite having `Search` imported in `HomePageClient`, there is no global search bar in the navbar. | Recognition Rather Recall | Users cannot find players, teams, or matches by typing. |
| N6 | **Active state indicator is a 2px underline** — Hard to see against the dark background. | Visibility of System Status | Users may not know which page they are on. |

### Medium Issues
- The `▾` character is used instead of a proper chevron icon — inconsistent with Lucide icon set used elsewhere.
- Escape key closes the matches panel but not the drawer (it only closes on click-outside or swipe).
- No breadcrumb navigation on nested pages like `/players/profiles/[id]` or `/teams/[slug]`.

### Redesign Recommendation

**Top nav:** Logo | Search bar | 4 nav links | Theme toggle | Avatar
**Mobile:** Hamburger → drawer with max 12 items grouped into 3 sections (Browse, My, Account)
**Remove:** The secondary match strip bar entirely. Move live match previews into a collapsible ticker or into the Matches page itself.

---

## 4. Individual Pages Audit

### 4a. Live Matches (`/matches`)

**What works:** Sectioned layout (Live / Upcoming / Recent / Featured / Simulations), `MatchRail` for horizontal scrolling, proper loading skeletons.

**Issues:**
- **Five sections stacked vertically** create a very long scroll. Live matches should be the primary focus, with other sections collapsed or on separate tabs.
- **Simulation cards inside the "Your Simulations" section** use raw `<Card>` with a delete button styled with `"✕"` text character instead of a Lucide `X` icon.
- **No match format indicator** — Users cannot distinguish T20 from ODI from Test at a glance.
- **The `MatchSection` title "Auto-refresh: 5m"** is developer-facing copy. Users should see "Updated just now" or relative timestamps.

### 4b. Match Detail (`/matches/[id]`)

**What works:** Score display with innings breakdown, stale data warning, back navigation.

**Issues:**
- **Extremely sparse page** — Only shows team names, score, series, venue, and date. No batting card, no bowling card, no wagon wheel, no partnerships, no commentary.
- **Status badges use different colors per status** — red text for live, blue for upcoming, gray for completed — but these are plain `<span>` elements, not the `MatchStatusPill` component used on the matches listing page.
- **Hardcoded "Data from CricAPI"** footer credit — breaks premium positioning.
- **No auto-scrolling or live update indicator** on the detail page itself (the 30s poll is invisible to users).

### 4c. Analytics (`/analytics`)

**What works:** Win probability chart, momentum heatmap, phase timeline, and top performers panels are architecturally sound.

**Issues:**
- **Native `<select>` dropdown** for match selection — unstyled, poor dark mode contrast, tiny click target. Should be a custom searchable combobox.
- **Win probability chart receives `data={[]}`** — the chart is always empty on initial render because data is not fetched. This is a functional bug.
- **Grid layout mismatch** — `lg:grid-cols-3` is used for 5 child components (`LiveScoreCard`, `TopPerformersPanel`, `ImpactLeaderboard`, `MatchNarrativePanel`, `TeamList`), causing layout jank as items wrap unpredictably.
- **No page heading matches the navbar** — The page title says "Match Analytics" but the nav highlights "Analytics". Terminology mismatch.

### 4d. Players (`/players`)

**Issues:**
- **`getPlayers()` is called at module level** — This is a synchronous function returning hardcoded data. No real database query. The entire player database appears to be static mock data.
- **`PlayerCard` receives a hardcoded `matchId="ind-vs-aus"`** — Every player card shows stats from the same single match.
- **Card styling uses `border-zinc-800`** — Hardcoded Tailwind class that breaks in light mode.
- **Impact score and form graph** are shown but without context — no explanation of what the impact number means or how the form graph is calculated.
- **No filtering, sorting, or search** — Users cannot find specific players.

### 4e. Teams (`/teams`)

**Issues:**
- **Only shows team name, short name, and city** — No player count, no recent results, no win/loss record.
- **No team logos or crests** — Visual identity is absent.
- **Empty state** is functional but sparse — should encourage team creation with an illustration.
- **Max width `max-w-4xl`** is narrower than other pages (`max-w-7xl`), creating inconsistent content width across the app.

### 4f. Match Prediction (`MatchPredictionPanel`)

**Issues:**
- **Pure text list** — "Projected Score: X", "Best Case: X", "Worst Case: X". No visualization whatsoever.
- **No confidence indicator** — Predictions without confidence ranges are misleading.
- **No contributing factors shown** — Users cannot understand WHY the model predicts what it predicts.
- **No model transparency** — No indication of what ML model is used, what features it considers, or how accurate it has been historically.
- **Panel has no header decoration, no AI branding** — Looks like a plain `<div>` with text, not an AI-powered prediction tool.

### 4g. Strategy Dashboard (`StrategyDashboard`)

**Issues:**
- **Uses `border-gray-800`** — Hardcoded color, breaks light mode.
- **Progress bars for batting/bowling control** use raw `<div>` elements with no labels on the scale (0% to 100% is implicit but never shown).
- **Momentum and Pressure are plain text** — "Momentum: BALANCED", "Pressure Level: LOW". No gauge, no color coding, no trend indicator.
- **Partnership shows only run count** — No ball count, no run rate, no comparison to average partnership length.

### 4h. Live Commentary Feed (`LiveCommentaryFeed`)

**What works:** Tone-based color coding (dramatic = red, celebratory = green, analytical = blue) is a strong design choice. Filter dropdown is functional.

**Issues:**
- **Filter is a native `<select>`** — Same unstyled dropdown problem as Analytics page.
- **No AI branding** — The title says "Live Commentary Intelligence" but there is no AI icon, sparkle, or indicator that this is AI-generated content.
- **Commentary items lack visual hierarchy** — Tone label and over number are the same font size and weight as the commentary text.
- **No expand/collapse** — Long commentary text is truncated with no way to read the full version.

### 4i. Match Insight Panel (`MatchInsightPanel`)

**Issues:**
- **Insights use emoji prefixes** (⚠ and ⚡) instead of proper icons.
- **Win probability, momentum, run rate, projected score, and required run rate** are listed as a flat key-value list with no visual differentiation — all the same font weight and size.
- **No trend arrows** — Users cannot tell if momentum is increasing or decreasing.
- **No connection to the win probability chart** — These numbers should feed into the chart, but they appear on separate panels.

### 4j. Missing Pages

The following pages from the navigation drawer have **no implementation**:
- `/live-matches`, `/live-scores`, `/schedule`
- `/series`, `/stats-center`, `/records`, `/venues`
- `/highlights`, `/photos`, `/auction-tracker`
- `/fantasy-insights`, `/rankings`, `/points-table`
- `/news`

This means **14 of 20 drawer navigation items lead to 404 pages**. Only 6 routes actually work.

---

## 5. Accessibility Audit

| WCAG Criterion | Status | Details |
|---|---|---|
| **1.1.1 Non-text Content** | Partial | Icons use `aria-hidden="true"` correctly. But emoji (🏏 🏃 ⚠ ⚡) are decorative without `aria-hidden`, causing screen readers to announce them. |
| **1.3.1 Info & Relationships** | Fail | No `<main>` landmark on several pages. `AppShellContent` wraps content in `<main>` but `AnalyticsPage` also uses its own `<main>`, creating nested landmarks. |
| **1.4.3 Contrast (Minimum)** | Fail | `--text-3: #475569` on `--surface-2: #040A14` yields a contrast ratio of approximately 2.8:1 — below the 4.5:1 AA requirement. This color is used for captions, timestamps, and secondary text throughout. |
| **1.4.11 Non-text Contrast** | Fail | Border colors (`--border: rgba(255,255,255,0.06)`) are nearly invisible, failing the 3:1 UI component contrast requirement. |
| **2.1.1 Keyboard** | Partial | The AppDrawer implements focus trapping correctly. But the Matches dropdown panel and many modals lack keyboard support. |
| **2.4.1 Bypass Blocks** | Fail | No skip-to-content link anywhere in the application. |
| **2.4.7 Focus Visible** | Fail | Most buttons and links rely on browser defaults. The `Button` component has no focus-visible styling. |
| **2.5.5 Target Size** | Fail | Filter pills in the navbar (44px strip bar) have clickable areas under 44x44px. Delete buttons on simulation cards are 28x28px. |
| **3.3.2 Labels or Instructions** | Fail | The Analytics page `<select>` has no `<label>` element. Input fields in the create match form use `placeholder` only — no associated labels. |
| **4.1.2 Name, Role, Value** | Partial | The notification bell button has `aria-label="Notifications"` — good. But the theme toggle lacks an accessible name. |

### Color Dependency
The application relies heavily on color alone to communicate status:
- Live = red dot/badge
- Upcoming = cyan/blue
- Completed = gray
- Success = green
- Warning = amber

There are no secondary indicators (icons, text labels, patterns) for colorblind users. The `MatchStatusPill` component uses text labels, which is good, but the `live-pulse-dot` and colored borders rely solely on hue.

---

## 6. Design System Assessment

### What Exists (Good Foundation)

The CSS design system in `globals.css` (826 lines) is actually well-architected:

- **Design tokens:** 80+ CSS custom properties covering colors, surfaces, borders, text, shadows, radii, spacing, typography, and chart colors
- **Typography scale:** 7 named levels from `score-display` (72px) down to `caption` (12px)
- **Spacing scale:** `--space-1` through `--space-12` (4px to 48px)
- **Dark and light themes** fully defined with semantic aliases
- **Utility classes:** `.glass`, `.glow-border`, `.gradient-text`, `.card-cinematic`, `.live-pulse-dot`
- **Animation library:** 15+ keyframe animations for live events, particles, and transitions

### What Is Broken

| Problem | Severity | Detail |
|---|---|---|
| **Token adoption is inconsistent** | Critical | `PlayerCard` uses `border-zinc-800` (raw Tailwind), `LiveScoreCard` uses `border-zinc-800`, `StrategyDashboard` uses `border-gray-800`. These bypass the token system entirely. |
| **No component-level design tokens** | High | Tokens define colors and spacing but not component variants (button sizes, card padding, badge shapes). Each component reinvents its own styling. |
| **Button component uses full inline CSS** | High | `Button.tsx` defines all styles via `style={{}}` objects. This makes it impossible to override with Tailwind classes or respond to theme changes cleanly. |
| **Card component mixes inline + Tailwind** | High | `Card.tsx` uses `style={{ background: ... }}` for core styles but `className` for layout. Two competing styling mechanisms in one component. |
| **No design token documentation** | Medium | Tokens exist in CSS but there is no Figma file, Storybook, or token documentation for designers/developers to reference. |
| **Typography scale is defined but unused** | Medium | `--heading-1-size`, `--body-size` etc. are defined but most components use raw Tailwind classes (`text-lg`, `text-sm`, `text-3xl`) instead of the token values. |
| **Spacing tokens unused** | Medium | `--space-1` through `--space-12` are defined but components use Tailwind's `p-4`, `gap-3`, `mb-6` etc. instead. |

### Missing Components

The following reusable components should be extracted:

1. `<ScoreDisplay>` — Standardized runs/wickets/overs rendering
2. `<MatchStatusBadge>` — Consolidates `GlowBadge`, `MatchStatusPill`, and inline status spans
3. `<TeamLogo>` — Placeholder/real team crest component
4. `<PlayerAvatar>` — Consistent player image with fallback
5. `<StatTile>` — Reusable stat display (label + value + optional trend)
6. `<ProgressBar>` — Themed progress indicator (replaces raw `<div>` in StrategyDashboard)
7. `<InsightCard>` — AI-generated insight with icon, text, and confidence
8. `<ChartCard>` — Wrapper for Recharts with consistent padding, header, and error boundary
9. `<EmptyState>` — Standardized empty state with illustration, message, and CTA
10. `<SectionHeader>` — Consistent section heading with optional subtitle and action

---

## 7. Responsive Design Analysis

| Breakpoint | Behavior | Issues |
|---|---|---|
| **1440px desktop** | Content centered at `max-w-[1100px]` or `max-w-7xl` (inconsistent). Lots of wasted horizontal space. | Two different max-widths across pages. Analytics uses `max-w-7xl`, Home uses `max-w-5xl`, Teams uses `max-w-4xl`. |
| **1280px laptop** | Generally functional. Grid layouts collapse gracefully. | Navbar quick links may overlap with Matches dropdown at this width. |
| **768px tablet** | Grid columns reduce (3→2→1). Mobile drawer activates. | The two-bar navbar (nav + match strip) takes 100px of vertical space — too much on tablet. |
| **375px mobile** | Single column. Drawer replaces top nav links. | Landing page hero text at `text-5xl` is still too large for small screens. Create form inputs stack vertically but buttons do not span full width. |
| **Critical mobile issue** | The match strip secondary bar (44px tall) persists on mobile, pushing content way down. Should collapse entirely on small screens. |

### Recommendations
- Standardize on `max-w-6xl` (1152px) across all authenticated pages.
- Remove the secondary match strip on screens < 768px.
- Reduce hero heading to `text-3xl` on mobile (currently `text-5xl` then `md:text-7xl`).
- Make create form buttons full-width on mobile.

---

## 8. Sports Analytics-Specific Assessment

### Trust & Professionalism
| Indicator | CricSmart | Cricbuzz / Sofascore |
|---|---|---|
| Live score prominence | Medium — buried in cards | Primary — always visible |
| Score format | Plain text | Large monospace with team colors |
| Match status | Small text badges | Color-coded full-width bars |
| Player photos | None | Every player has a headshot |
| Team crests | None | Every team has a logo |
| Commentary | Text-only list | Ball-by-ball with icons and timestamps |

### Live Match Excitement
The `StadiumOverlay`, `BroadcastDirectorPanel`, `MomentumMeter`, and `MatchDramaMeter` components exist but are **not integrated into the main match viewing experience**. They appear to be experimental components that were built but never wired into the primary UI flow.

### AI Intelligence Presentation
- `MatchPredictionPanel` is a plain text list — no visualization, no model explanation
- `MatchInsightPanel` shows raw numbers without context
- `StrategyDashboard` displays control percentages as simple progress bars
- None of these panels have "AI-powered" branding, sparkle icons, or model transparency indicators
- The word "AI" or "Intelligence" appears in component names but not in the visual design

### Comparison to Competitors
CricSmart falls short in these specific areas:

1. **Score visualization** — Competitors use large monospace fonts with team-colored backgrounds. CricSmart uses plain `<span>` elements.
2. **Ball-by-ball granularity** — The data engine supports it (overs, balls, events), but the UI does not surface it in an engaging way.
3. **Wagon wheel / pitch map** — `WagonWheel.tsx` exists but is only accessible via the analytics panel, not the match view.
4. **Head-to-head records** — No component exists for this.
5. **Venue statistics** — No component exists for this.
6. **Player career timeline** — No component exists for this.
7. **Historical comparison** — No component exists for this.

---

## 9. Prioritized Action Plan

### Sprint 1 — Critical Fixes (Week 1-2)

| Task | Effort | Impact |
|---|---|---|
| Fix all `border-zinc-800` / `border-gray-800` to use `border-[var(--border)]` | 2 hours | Light mode stops breaking |
| Add `<label>` elements to all form inputs | 1 hour | WCAG 3.3.2 compliance |
| Increase `--text-3` contrast to meet 4.5:1 ratio (change to `#64748B` or brighter) | 30 min | WCAG 1.4.3 compliance |
| Add skip-to-content link in root layout | 30 min | WCAG 2.4.1 compliance |
| Add `focus-visible:ring-2` to all interactive elements | 2 hours | WCAG 2.4.7 compliance |
| Remove non-existent routes from AppDrawer navigation | 1 hour | Eliminates 14 broken links |
| Fix Win Probability Chart empty data issue (`data={[]}`) | 2 hours | Core feature actually works |
| Remove `typescript.ignoreBuildErrors` and fix type errors | 4 hours | Production safety |

### Sprint 2 — Consistency (Week 3-4)

| Task | Effort | Impact |
|---|---|---|
| Consolidate `Button.tsx` to use Tailwind + tokens instead of inline styles | 3 hours | Consistent button styling |
| Consolidate `Card.tsx` to absorb `.card-cinematic` / `.card-cinematic-static` | 4 hours | Single card system |
| Replace all emoji (🏏 🏃 ⚠ ⚡ 🔥) with Lucide icons | 2 hours | Professional tone |
| Extract `<ScoreDisplay>`, `<MatchStatusBadge>`, `<StatTile>`, `<EmptyState>` components | 6 hours | Reusable design system |
| Standardize max-width across all pages to `max-w-6xl` | 1 hour | Consistent content width |
| Replace native `<select>` elements with custom combobox components | 4 hours | Better UX + theme support |
| Unify navbar into single `<AppNavbar>` component | 4 hours | Eliminate duplication |
| Remove secondary match strip bar on mobile | 1 hour | More content visibility |

### Sprint 3 — Premium Feel (Week 5-8)

| Task | Effort | Impact |
|---|---|---|
| Add team logos and player headshots | 8 hours | Visual credibility |
| Redesign hero section with embedded product preview | 6 hours | Higher conversion |
| Build comprehensive footer with sitemap, social, legal | 4 hours | Trust signals |
| Add AI branding to prediction/insight panels (sparkle icon, confidence badges, model info) | 4 hours | Premium AI feel |
| Redesign match detail page with batting/bowling cards, wagon wheel, partnerships | 16 hours | Core value proposition |
| Build global search with player/team/match results | 8 hours | Discoverability |
| Add breadcrumbs to nested routes | 2 hours | Wayfinding |
| Implement skeleton loading consistently across all pages | 4 hours | Polished loading states |
| Add trend indicators (arrows, sparklines) to insight panels | 4 hours | At-a-glance intelligence |
| Create Storybook documentation for design tokens and components | 8 hours | Developer onboarding |

---

## 10. Final Verdict

CricSmart is a **college final-year project with startup MVP aspirations**.

**Evidence for this classification:**
- The CSS design token system is genuinely well-designed — better than many production apps. This suggests strong foundational knowledge.
- However, component-level execution is wildly inconsistent. Some components (`WinProbabilityChart`, `GlowBadge`, `MatchCardCompact`) feel polished, while others (`LiveScoreCard`, `StrategyDashboard`, `MatchPredictionPanel`) look like weekend prototypes.
- 14 of 20 navigation items lead to dead pages. This is the clearest indicator that the IA was designed aspirationally rather than implementation-first.
- The ML backend (Python, scikit-learn, joblib models) is more mature than the frontend presentation layer — a common pattern in engineering-heavy student projects.
- No team logos, no player photos, no real typography hierarchy in data-dense views, and no global search suggest the product was built data-first without UX design involvement.

**What separates this from a production SaaS product:**
1. Inconsistent component styling (3 different card systems, 2 button approaches, mixed token adoption)
2. Missing critical pages (rankings, news, fantasy, records, venues)
3. No accessibility baseline (contrast failures, missing labels, no skip link)
4. No real-time data visualization in match views (the broadcast components exist but are not integrated)
5. AI features are presented as plain text, not as intelligent, trustworthy insights

**What separates this from a mere prototype:**
1. Real authentication system with NextAuth
2. PostgreSQL database with Prisma ORM
3. WebSocket/SSE architecture for live data
4. Python ML pipeline for win probability and commentary
5. A design token system that, if adopted consistently, would provide a solid design foundation

**To reach "Premium Sports Analytics Platform" status, the top priority is not more features — it is ruthless consistency.** Adopt the existing design tokens everywhere, consolidate component variants, remove dead navigation, and invest in the match detail view where users spend 80% of their time.
