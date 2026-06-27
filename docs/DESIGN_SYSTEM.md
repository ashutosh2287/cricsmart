# CricSmart Design System

## Design Tokens

### Colors (Dark Theme)

| Token | Value | Usage |
|---|---|---|
| `--brand` | `#00E5FF` | Primary brand color, links, active states |
| `--accent` | `#7C3AED` | Secondary accent, AI features |
| `--danger` | `#EF4444` | Errors, live indicators, wickets |
| `--success` | `#00FF87` | Success states, positive trends |
| `--amber` | `#F59E0B` | Warnings, warnings, highlights |
| `--surface` | `#0A1628` | Card backgrounds |
| `--surface-2` | `#040A14` | Page background |
| `--surface-3` | `#0F1D32` | Raised elements, inputs |
| `--surface-4` | `#162240` | Hover states, overlays |
| `--text-1` | `#F0F4F8` | Primary text |
| `--text-2` | `#94A3B8` | Secondary text |
| `--text-3` | `#8896A6` | Muted text (WCAG AA compliant) |

### Typography Scale

| Level | Size | Weight | Usage |
|---|---|---|---|
| `--score-display-size` | 72px | 800 | Hero scores |
| `--score-large-size` | 48px | 700 | Large scores |
| `--heading-1-size` | 28px | 700 | Page titles |
| `--heading-2-size` | 20px | 600 | Section headings |
| `--heading-3-size` | 15px | 600 | Card headings |
| `--body-size` | 14px | 400 | Body text |
| `--caption-size` | 12px | 400 | Captions, labels |

### Spacing Scale

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |

### Border Radius

| Token | Value |
|---|---|
| `--radius-sm` | 6px |
| `--radius-md` | 10px |
| `--radius-lg` | 14px |
| `--radius-xl` | 20px |

### Shadows

| Token | Usage |
|---|---|
| `--shadow-card` | Default card elevation |
| `--shadow-hover` | Card hover state |
| `--shadow-glow-cyan` | Brand glow effect |
| `--shadow-glow-purple` | Accent glow effect |
| `--shadow-glow-green` | Success glow effect |

---

## Components

### ScoreDisplay

Consistent score rendering across the app.

```tsx
<ScoreDisplay runs={186} wickets={4} overs={15.2} size="md" />
// Output: 186/4 (15.2 ov)

<ScoreDisplay runs={312} wickets={7} size="lg" />
// Output: 312/7
```

**Props:**
- `runs: number` — Total runs
- `wickets: number` — Total wickets
- `overs?: number` — Overs completed
- `oversDisplay?: string` — Custom overs text
- `size?: "sm" | "md" | "lg"` — Display size

---

### MatchStatusBadge

Unified status indicators for matches.

```tsx
<MatchStatusBadge status="live" />      // 🔴 LIVE
<MatchStatusBadge status="completed" /> // Completed
<MatchStatusBadge status="upcoming" />  // Upcoming
<MatchStatusBadge status="stale" />     // ⚠ Delayed
```

**Props:**
- `status: "live" | "completed" | "upcoming" | "stale"`
- `showPulse?: boolean` — Show animated pulse for live (default: true)

---

### TeamLogo

Auto-colored team logo with initials fallback.

```tsx
<TeamLogo name="India" size="md" />     // Blue square with "IN"
<TeamLogo name="Australia" size="lg" /> // Yellow square with "AU"
<TeamLogo name="Mumbai Tigers" shortName="MT" />
```

**Props:**
- `name: string` — Team name (used for color + initials)
- `shortName?: string` — Custom initials
- `size?: "sm" | "md" | "lg"`

---

### PlayerAvatar

Player avatar with initials and color fallback.

```tsx
<PlayerAvatar name="Virat Kohli" size="md" />
<PlayerAvatar name="Steve Smith" avatarUrl="/photos/smith.jpg" />
```

**Props:**
- `name: string` — Player name
- `avatarUrl?: string | null` — Image URL
- `size?: "sm" | "md" | "lg"`

---

### StatTile

Reusable stat display with trend support.

```tsx
<StatTile label="Runs" value={186} icon={<TrendingUp />} trend="up" trendValue="+12" />
<StatTile label="Wickets" value={4} />
```

**Props:**
- `label: string` — Stat name
- `value: string | number` — Stat value
- `icon?: ReactNode` — Optional icon
- `trend?: "up" | "down" | "neutral"` — Trend direction
- `trendValue?: string` — Trend text

---

### EmptyState

Consistent empty states across the app.

```tsx
<EmptyState
  icon={<Trophy />}
  title="No matches yet"
  description="Host your first match to get started"
  action={<Button onClick={createMatch}>Create Match</Button>}
/>
```

**Props:**
- `icon?: ReactNode` — Defaults to Inbox icon
- `title: string` — Main message
- `description?: string` — Supporting text
- `action?: ReactNode` — CTA button

---

### Breadcrumbs

Navigation breadcrumbs for nested routes.

```tsx
<Breadcrumbs items={[
  { label: "Teams", href: "/teams" },
  { label: "India" }
]} />
// Output: Home / Teams / India
```

**Props:**
- `items: BreadcrumbItem[]` — `{ label: string; href?: string }`

---

### TrendIndicator

Numeric trend display with arrow icon.

```tsx
<TrendIndicator value={62.5} previousValue={58.3} suffix="%" />
// Output: ↑ 62.5% (green)

<TrendIndicator value={3.2} decimals={2} />
// Output: → 3.20
```

**Props:**
- `value: number` — Current value
- `previousValue?: number` — Previous value for comparison
- `suffix?: string` — Unit suffix
- `decimals?: number` — Decimal places

---

### Select

Custom select dropdown with consistent styling.

```tsx
<Select
  label="Match Format"
  placeholder="Select format"
  options={[
    { value: "T20", label: "T20" },
    { value: "ODI", label: "ODI" },
    { value: "TEST", label: "Test" },
  ]}
  value={format}
  onChange={(e) => setFormat(e.target.value)}
/>
```

---

### Skeleton

Loading skeleton with shimmer animation.

```tsx
<Skeleton variant="text" />
<Skeleton variant="card" />
<Skeleton variant="chart" className="h-64" />
<Skeleton variant="text" lines={3} />
<ScoreCardSkeleton />
```

**Variants:** `rect`, `text`, `circle`, `chart`, `card`, `avatar`, `score`, `stat`

---

### GlobalSearch

Full-screen search modal with keyboard navigation.

```tsx
<GlobalSearch onClose={() => setOpen(false)} />
```

Triggered from the navbar search button. Searches players, teams, and matches via `/api/search`.

---

## CSS Utility Classes

| Class | Description |
|---|---|
| `.card-cinematic` | Card with hover elevation and border glow |
| `.card-cinematic-static` | Card without hover effects |
| `.glass` | Glassmorphism with backdrop blur |
| `.glow-border` | Cyan glow border effect |
| `.gradient-text` | Cyan-to-purple gradient text |
| `.live-pulse-dot` | Animated red pulse dot |
| `.gradient-mesh` | Multi-color radial gradient background |

---

## Accessibility Checklist

- [x] All text meets WCAG AA contrast (4.5:1 minimum)
- [x] Focus-visible rings on all interactive elements
- [x] Skip-to-content link for keyboard navigation
- [x] Labels on all form inputs
- [x] ARIA labels on icon-only buttons
- [x] Semantic HTML (nav, main, footer landmarks)
- [ ] Color is not the sole indicator of status
- [ ] All images have alt text
- [ ] Keyboard navigation works in all modals
