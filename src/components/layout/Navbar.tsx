"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from "react";
import { motion } from "framer-motion";

import AppDrawer from "@/components/navigation/AppDrawer";
import UserAvatar from "@/components/account/UserAvatar";
import MobileMenuButton from "@/components/navigation/MobileMenuButton";
import { isPathActive } from "@/components/navigation/navigationUtils";
import ThemeToggle from "@/components/ui/ThemeToggle";
import GlobalSearch from "@/components/ui/GlobalSearch";
import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { useAuth } from "@/providers/AuthProvider";
import { useDrawer } from "@/hooks/useDrawer";

type FixtureScoreEntry = { r?: number; w?: number; o?: number };

type FixtureMatch = {
  id?: string;
  name?: string;
  matchCategory?: string;
  matchType?: string;
  status?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  teamInfo?: { name?: string }[];
  score?: FixtureScoreEntry[];
  isLive?: boolean;
};

type SimMatch = {
  matchId: string;
  teamA: string;
  teamB: string;
  status?: string;
  type?: string;
  score?: string;
  overDisplay?: string;
};

type PanelMatch = {
  id: string;
  name: string;
  teamA: string;
  teamB: string;
  matchCategory: string;
  dateTimeGMT?: string;
  isLive: boolean;
  scoreText?: string;
};

type MatchesFilter = "all" | "live" | "today";

type GroupedMatches = {
  live: PanelMatch[];
  international: PanelMatch[];
  league: PanelMatch[];
  domestic: PanelMatch[];
  women: PanelMatch[];
};

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Teams", href: "/account/teams" },
  { name: "Players", href: "/players" },
  { name: "Analytics", href: "/analytics" },
];

const PANEL_CACHE_MS = 60_000;
const PANEL_TOP_OFFSET = 108;

function splitTeams(name?: string): [string, string] {
  if (!name) return ["Team A", "Team B"];
  const [a, b] = name.split(/\s+vs\s+/i);
  return [a?.trim() || "Team A", b?.trim() || "Team B"];
}

function toPanelFixture(match: FixtureMatch): PanelMatch | null {
  if (!match.id) return null;
  const [fallbackA, fallbackB] = splitTeams(match.name);
  const teamA = match.teamInfo?.[0]?.name ?? match.teams?.[0] ?? fallbackA;
  const teamB = match.teamInfo?.[1]?.name ?? match.teams?.[1] ?? fallbackB;
  const scoreEntries = Array.isArray(match.score) ? match.score : [];
  const scoreText =
    scoreEntries.length > 0
      ? scoreEntries
          .slice(0, 2)
          .map((entry) => `${entry.r ?? 0}/${entry.w ?? 0}${entry.o !== undefined ? ` (${entry.o})` : ""}`)
          .join(" • ")
      : undefined;

  return {
    id: match.id,
    name: match.name ?? `${teamA} vs ${teamB}`,
    teamA,
    teamB,
    matchCategory: (match.matchCategory ?? match.matchType ?? "").toUpperCase(),
    dateTimeGMT: match.dateTimeGMT ?? match.date,
    isLive: Boolean(match.isLive),
    scoreText,
  };
}

function toPanelSimulation(match: SimMatch): PanelMatch {
  const scoreText =
    match.score && match.overDisplay
      ? `${match.score} (${match.overDisplay})`
      : match.score
        ? match.score
        : undefined;

  return {
    id: match.matchId,
    name: `${match.teamA} vs ${match.teamB}`,
    teamA: match.teamA,
    teamB: match.teamB,
    matchCategory: (match.type ?? "DOMESTIC").toUpperCase(),
    isLive: String(match.status).toUpperCase() === "LIVE",
    scoreText,
  };
}

function isToday(dateValue?: string): boolean {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

function groupMatches(matches: PanelMatch[]): GroupedMatches {
  return {
    live: matches.filter((m) => m.isLive),
    international: matches.filter(
      (m) => m.matchCategory === "T20I" || m.matchCategory === "ODI" || m.matchCategory === "TEST",
    ),
    league: matches.filter((m) => m.matchCategory === "IPL"),
    domestic: matches.filter((m) => m.matchCategory === "DOMESTIC"),
    women: matches.filter((m) => (m.name || "").toLowerCase().includes("women")),
  };
}

function MatchRow({ match, onClick }: { match: PanelMatch; onClick: () => void }) {
  return (
    <Link
      href={`/matches/${match.id}`}
      onClick={onClick}
      className="flex h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-[var(--bg-raised)]"
      style={{ border: "1px solid transparent" }}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--text-primary)]">
          {match.teamA} <span className="text-[var(--text-muted)]">vs</span> {match.teamB}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {match.scoreText ? <span className="hidden text-[var(--text-secondary)] md:inline">{match.scoreText}</span> : null}
        {match.isLive ? (
          <span className="rounded-full bg-red-500/15 px-2 py-0.5 font-semibold uppercase tracking-[0.08em] text-[var(--accent-live)]">
            Live
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  // ── Hide entirely on the public landing page ─────────────────────
  if (pathname === "/") return null;

  return <NavbarInner pathname={pathname} />;
}

function NavbarInner({ pathname }: { pathname: string }) {
  const [matchesPanelOpen, setMatchesPanelOpen] = useState(false);
  const [allDropdownOpen, setAllDropdownOpen] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [matchesFilter, setMatchesFilter] = useState<MatchesFilter>("all");
  const [panelMatches, setPanelMatches] = useState<PanelMatch[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const lastFetchedAtRef = useRef(0);
  const allDropdownRef = useRef<HTMLDivElement>(null);
  const { isOpen, closeDrawer, toggleDrawer } = useDrawer();
  const { user, isAuthenticated, authEnabled, loading: authLoading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeLink = quickLinks.find((link) => isPathActive(pathname, link.href));

  useEffect(() => {
    startTransition(() => {
      closeDrawer();
      setMatchesPanelOpen(false);
      setAllDropdownOpen(false);
    });
  }, [pathname, closeDrawer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMatchesPanelOpen(false);
        setAllDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!allDropdownOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (allDropdownRef.current && !allDropdownRef.current.contains(event.target as Node)) {
        setAllDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [allDropdownOpen]);

  const loadMatches = useCallback(async () => {
    const now = Date.now();
    if (panelMatches.length > 0 && now - lastFetchedAtRef.current < PANEL_CACHE_MS) return;

    setLoadingMatches(true);
    try {
      const [fixturesRes, simRes] = await Promise.all([
        fetch("/api/live/fixtures", { cache: "no-store" }),
        fetch("/api/matches", { cache: "no-store" }),
      ]);

      const fixturesPayload = (await fixturesRes.json()) as { data?: FixtureMatch[] } | FixtureMatch[];
      const simPayload = (await simRes.json()) as SimMatch[];

      const fixtures = Array.isArray(fixturesPayload)
        ? fixturesPayload
        : Array.isArray(fixturesPayload?.data)
          ? fixturesPayload.data
          : [];
      const simulations = Array.isArray(simPayload) ? simPayload : [];

      const merged = [
        ...fixtures.map(toPanelFixture).filter((match): match is PanelMatch => Boolean(match)),
        ...simulations.map(toPanelSimulation),
      ];

      setPanelMatches(merged);
      lastFetchedAtRef.current = now;
    } catch {
      setPanelMatches((prev) => prev);
    } finally {
      setLoadingMatches(false);
    }
  }, [panelMatches.length]);

  useEffect(() => {
    if (!matchesPanelOpen) return;
    const id = setTimeout(() => { void loadMatches(); }, 0);
    return () => clearTimeout(id);
  }, [matchesPanelOpen, loadMatches]);

  const filteredMatches = useMemo(() => {
    if (matchesFilter === "live") return panelMatches.filter((match) => match.isLive);
    if (matchesFilter === "today") return panelMatches.filter((match) => isToday(match.dateTimeGMT));
    return panelMatches;
  }, [matchesFilter, panelMatches]);

  const groupedMatches = useMemo(() => groupMatches(filteredMatches), [filteredMatches]);

  const stripMatches = useMemo(() => panelMatches.slice(0, 4), [panelMatches]);

  const closePanel = () => setMatchesPanelOpen(false);

  const togglePanel = () => {
    setMatchesPanelOpen((prev) => !prev);
    setAllDropdownOpen(false);
  };

  const handleSelectFilter = (filter: MatchesFilter) => {
    setMatchesFilter(filter);
    setAllDropdownOpen(false);
    setMatchesPanelOpen(true);
  };

  return (
    <>
      <div className="z-50">
        <nav
          className="relative"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: scrolled ? "blur(16px) saturate(180%)" : "blur(10px)",
            WebkitBackdropFilter: scrolled ? "blur(16px) saturate(180%)" : "blur(10px)",
            background: scrolled
              ? "color-mix(in srgb, var(--nav-bg) 82%, transparent)"
              : "var(--nav-bg)",
            borderBottom: scrolled
              ? "0.5px solid color-mix(in srgb, var(--nav-border) 60%, transparent)"
              : "0.5px solid var(--nav-border)",
            transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
          }}
        >
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <MobileMenuButton isOpen={isOpen} onClick={toggleDrawer} />
              <AnimatedLogo size="sm" />
            </div>

            <div className="hidden items-center gap-5 md:flex">
              {quickLinks.map((link) => {
                const isActive = isPathActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-1 py-1 transition"
                    style={
                      isActive
                        ? { color: "var(--brand)", fontWeight: 600 }
                        : { color: "var(--text-2)", fontWeight: 500, fontSize: 14 }
                    }
                  >
                    {link.name}
                    {isActive ? (
                      <motion.span
                        layoutId="navbar-active-indicator"
                        className="absolute -bottom-[9px] left-0 right-0 h-[2px] rounded-full bg-[var(--brand)]"
                        transition={{ type: "spring", stiffness: 500, damping: 34 }}
                      />
                    ) : null}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={togglePanel}
                className="inline-flex items-center gap-1.5 transition"
                style={
                  matchesPanelOpen
                    ? { color: "var(--brand)", fontWeight: 600 }
                    : { color: "var(--text-2)", fontWeight: 500, fontSize: 14 }
                }
              >
                Matches
                <span className={`inline-block transition-transform duration-200 ${matchesPanelOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
            </div>

            <div className="flex min-w-[120px] items-center justify-end gap-3 md:min-w-[190px]">
              <span className="hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)]/40 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-[var(--text-secondary)] md:inline-flex">
                {matchesPanelOpen ? "Matches" : activeLink?.name ?? "Cricket"}
              </span>
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-2)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              >
                <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--text-2)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
              >
                <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
                  <path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 14a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--accent-live)] opacity-0" />
              </button>
              <ThemeToggle />
              {authLoading ? (
                <span className="inline-flex h-9 w-20 animate-pulse rounded-md border border-[var(--border-subtle)] bg-[var(--bg-raised)]/50" />
              ) : authEnabled && isAuthenticated ? (
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Link
                    href="/account/profile"
                    aria-label="Open account profile"
                    className="inline-flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brand)]/80"
                    style={{ boxShadow: "none" }}
                  >
                    <UserAvatar
                      username={user?.username}
                      avatarUrl={user?.avatarUrl}
                      sizeClassName="h-9 w-9 ring-2 ring-transparent hover:ring-[var(--brand)]/30 transition-all"
                      textSizeClassName="text-xs"
                    />
                  <span className="hidden max-w-24 truncate text-sm font-medium text-[var(--text-primary)] md:inline">
                    {user?.username}
                  </span>
                </Link>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/login?redirect=${encodeURIComponent(pathname || "/")}`}
                    className="rounded-md border border-[var(--border-subtle)] px-2.5 py-1.5 text-sm text-[var(--text-primary)] transition hover:border-[var(--accent-brand)]/70"
                  >
                    Login
                  </Link>
                  <Link
                    href={`/signup?redirect=${encodeURIComponent(pathname || "/")}`}
                    className="rounded-md px-2.5 py-1.5 text-sm font-medium transition hover:opacity-90"
                    style={{ background: "var(--brand)", color: "var(--text-inv)" }}
                  >
                    Signup
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        <div className="relative border-b border-[var(--border-subtle)] bg-[var(--bg-raised)]/72 backdrop-blur-sm hidden md:block">
          <div className="mx-auto flex h-11 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
            <button
              type="button"
              onClick={togglePanel}
              className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.13em] transition ${
                matchesPanelOpen
                  ? "text-[var(--accent-brand)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Matches
              <span className={`inline-block transition-transform duration-200 ${matchesPanelOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            <div className="hidden min-w-0 flex-1 items-center gap-5 md:flex">
              {stripMatches.length === 0 ? (
                <span className="text-xs text-[var(--text-muted)]">Latest fixtures will appear here</span>
              ) : (
                stripMatches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      setMatchesPanelOpen(true);
                      setMatchesFilter("all");
                    }}
                    className="truncate text-sm text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
                  >
                    {match.teamA} vs {match.teamB}
                  </button>
                ))
              )}
            </div>

            <div className="relative" ref={allDropdownRef}>
              <button
                type="button"
                onClick={() => setAllDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-primary)] transition hover:text-[var(--accent-brand)]"
              >
                {matchesFilter === "all" ? "All" : matchesFilter === "live" ? "Live Now" : "Today"}
                <span className={`inline-block text-xs transition-transform duration-200 ${allDropdownOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
              <div
                className={`absolute right-0 top-full mt-2 w-36 origin-top-right rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1 shadow-xl transition-all duration-200 ${
                  allDropdownOpen ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-2 scale-95 opacity-0"
                }`}
              >
                {[
                  { key: "all", label: "All" },
                  { key: "live", label: "Live Now" },
                  { key: "today", label: "Today" },
                ].map((option) => {
                  const isActive = option.key === matchesFilter;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSelectFilter(option.key as MatchesFilter)}
                      className={`flex w-full items-center rounded-md px-2.5 py-2 text-left text-sm transition ${
                        isActive
                          ? "bg-[var(--bg-raised)] text-[var(--accent-brand)]"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {matchesPanelOpen ? (
        <button
          type="button"
          aria-label="Close matches panel"
          className="fixed inset-0 z-30 bg-black/40"
          onClick={closePanel}
        />
      ) : null}

      <div
        className={`matches-panel ${matchesPanelOpen ? "open" : ""}`}
        style={{ top: PANEL_TOP_OFFSET, maxHeight: 480, overflowY: "auto" }}
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMatchesFilter("all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                matchesFilter === "all"
                  ? "bg-[var(--bg-raised)] text-[var(--accent-brand)]"
                  : "bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setMatchesFilter("live")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                matchesFilter === "live"
                  ? "bg-[var(--bg-raised)] text-[var(--accent-brand)]"
                  : "bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Live Now
            </button>
            <button
              type="button"
              onClick={() => setMatchesFilter("today")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                matchesFilter === "today"
                  ? "bg-[var(--bg-raised)] text-[var(--accent-brand)]"
                  : "bg-[var(--bg-raised)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Today
            </button>
          </div>

          {loadingMatches ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-11 animate-pulse rounded-lg"
                  style={{
                    background: "color-mix(in srgb, var(--bg-raised) 76%, transparent)",
                    border: "1px solid var(--border-subtle)",
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-[minmax(220px,0.95fr)_minmax(0,1.05fr)]">
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)]/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent-live)]">🔴 Live</p>
                <div className="space-y-1">
                  {groupedMatches.live.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No live matches</p>
                  ) : (
                    groupedMatches.live.map((match) => <MatchRow key={`live-${match.id}`} match={match} onClick={closePanel} />)
                  )}
                </div>
              </div>

              <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)]/60 p-3">
                {[
                  { title: "International", key: "international" as const },
                  { title: "League", key: "league" as const },
                  { title: "Domestic", key: "domestic" as const },
                  { title: "Women", key: "women" as const },
                ].map((section) => {
                  const entries = groupedMatches[section.key];
                  return (
                    <div key={section.key}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                        {section.title}
                      </p>
                      {entries.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No matches</p>
                      ) : (
                        <div className="space-y-1">
                          {entries.map((match) => (
                            <MatchRow key={`${section.key}-${match.id}`} match={match} onClick={closePanel} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AppDrawer isOpen={isOpen} pathname={pathname} onClose={closeDrawer} />
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
    </>
  );
}