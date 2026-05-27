"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import { LiveMatchDropdown } from "@/components/home/LiveMatchDropdown";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ApiMatch = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: "LIVE" | "UPCOMING" | "COMPLETED";
};

type Match = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: "Live" | "Upcoming" | "Completed";
};

type ScoreEntry = { r?: number; w?: number; o?: number; inning?: string };

type RealMatch = {
  id: string;
  name?: string;
  matchType?: string;
  matchCategory?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  teamInfo?: { name?: string; shortname?: string }[];
  score?: ScoreEntry[];
  isLive?: boolean;
  isCompleted?: boolean;
};

type HomePageClientProps = {
  liveMatchCount: number;
  teamCount: number;
  totalMatchCount: number;
  liveHostedMatches: {
    id: string;
    runtimeMatchId: string;
    title: string;
    teamA: string;
    teamB: string;
    tossWinner?: string;
    tossDecision?: string;
    battingTeam?: string;
    currentScore?: string;
    currentOvers?: string;
  }[];
  isLoggedIn: boolean;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getTeamNames(match: RealMatch): [string, string] {
  const a =
    match.teamInfo?.[0]?.name ??
    match.teams?.[0] ??
    (match.name ?? "").split(/\s+vs\s+/i)[0]?.trim() ??
    "Team A";
  const b =
    match.teamInfo?.[1]?.name ??
    match.teams?.[1] ??
    (match.name ?? "").split(/\s+vs\s+/i)[1]?.trim() ??
    "Team B";
  return [a, b];
}

function formatScore(entry: ScoreEntry): string {
  const runs = entry.r ?? 0;
  const wkts = entry.w ?? 0;
  const overs = entry.o ?? 0;
  return `${runs}/${wkts} (${overs} ov)`;
}

function categoryBadgeColor(cat: string) {
  const c = cat.toUpperCase();
  if (c === "IPL") return { bg: "var(--accent-light)", color: "var(--accent)" };
  if (c === "TEST") return { bg: "var(--danger-light)", color: "var(--danger)" };
  if (c === "ODI") return { bg: "var(--brand-light)", color: "var(--brand)" };
  if (c.includes("T20")) return { bg: "var(--surface-3)", color: "var(--text-2)" };
  return {
    bg: "color-mix(in srgb, var(--text-1) 8%, transparent)",
    color: "var(--text-2)",
  };
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function LiveMatchCard({ match }: { match: RealMatch }) {
  const [teamA, teamB] = getTeamNames(match);
  const category = match.matchCategory ?? match.matchType?.toUpperCase() ?? "T20";
  const scores = Array.isArray(match.score) ? match.score : [];
  const badge = categoryBadgeColor(category);

  return (
    <Link href={`/matches/${match.id}`}>
      <div
        className="rounded-xl p-4 transition-colors cursor-pointer group"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        {/* Top row */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded"
            style={{ background: badge.bg, color: badge.color }}
          >
            {category}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--danger)" }}>
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "var(--danger)" }}
              />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "var(--danger)" }} />
            </span>
            LIVE
          </span>
        </div>

        {/* Teams */}
        <p
          className="text-sm font-semibold mb-2 leading-snug"
          style={{ color: "var(--text-1)" }}
        >
          {teamA}
          <span style={{ color: "var(--text-3)" }}> vs </span>
          {teamB}
        </p>

        {/* Scores */}
        {scores.length > 0 && (
          <div className="space-y-0.5">
            {scores.slice(0, 2).map((s, i) => (
              <p
                key={i}
                className="text-xs tabular-nums font-mono"
                style={{ color: "var(--text-2)" }}
              >
                {formatScore(s)}
              </p>
            ))}
          </div>
        )}

        {/* Status text */}
        {match.status && (
          <p
            className="text-[11px] mt-2 truncate"
            style={{ color: "var(--text-3)" }}
          >
            {match.status}
          </p>
        )}
      </div>
    </Link>
  );
}

function SimulationRow({
  match,
  onDelete,
  isDeleting,
}: {
  match: Match;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const statusColor =
    match.status === "Live"
      ? "var(--danger)"
      : match.status === "Completed"
      ? "var(--text-3)"
      : "var(--brand)";

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl group transition-colors"
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <Link
        href={`/match/${match.matchId}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        {/* Live dot */}
        {match.status === "Live" && (
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "var(--danger)" }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: "var(--danger)" }}
            />
          </span>
        )}

        <span
          className="font-medium text-sm truncate"
          style={{ color: "var(--text-1)" }}
        >
          {match.teamA} vs {match.teamB}
        </span>

        <span
          className="text-[11px] font-medium uppercase tracking-[0.12em] shrink-0"
          style={{ color: statusColor }}
        >
          {match.status}
        </span>
      </Link>

      <div className="flex items-center gap-2 ml-3 shrink-0">
        <Link
          href={`/match/${match.matchId}`}
          className="text-[11px] px-3 py-1.5 rounded-lg transition-colors"
          style={{
            background: "var(--bg-overlay)",
            color: "var(--text-2)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          Open →
        </Link>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-colors disabled:opacity-40"
          style={{
            background: "var(--bg-overlay)",
            color: "var(--text-3)",
            border: "1px solid var(--border-subtle)",
          }}
          title="Delete"
        >
          {isDeleting ? "…" : "✕"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function HomePageClient({
  liveMatchCount,
  teamCount,
  totalMatchCount,
  liveHostedMatches,
  isLoggedIn,
}: HomePageClientProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<RealMatch[]>([]);
  const [liveStale, setLiveStale] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamAInput, setTeamAInput] = useState("");
  const [teamBInput, setTeamBInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { authEnabled, isAuthenticated, loading: authLoading } = useAuth();

  function closeCreateForm() {
    setShowCreateForm(false);
    setTeamAInput("");
    setTeamBInput("");
  }

  // Fetch simulated matches
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/matches");
        const data: ApiMatch[] = await res.json();
        const normalized: Match[] = data.map((m) => ({
          matchId: m.matchId,
          teamA: m.teamA,
          teamB: m.teamB,
          status:
            m.status === "LIVE"
              ? "Live"
              : m.status === "COMPLETED"
              ? "Completed"
              : "Upcoming",
        }));
        if (mounted) setMatches(normalized);
      } catch {}
    };
    load();
    const interval = setInterval(load, 3000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Fetch live (real) matches
  useEffect(() => {
    let mounted = true;
    const snap = { current: [] as RealMatch[] };
    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = (await res.json()) as { data?: RealMatch[]; stale?: boolean };
        if (!mounted) return;
        const data = Array.isArray(payload.data) ? payload.data : [];
        const live = data.filter((m) => m.isLive);
        snap.current = live;
        setLiveMatches(live);
        setLiveStale(Boolean(payload.stale));
      } catch {
        if (!mounted) return;
        if (snap.current.length > 0) { setLiveMatches(snap.current); setLiveStale(true); }
      }
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Close create form on outside click / escape
  useEffect(() => {
    if (!showCreateForm) return;
    const onDown = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) closeCreateForm();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeCreateForm(); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [showCreateForm]);

  const handleCreateMatch = async () => {
    if (!authLoading && authEnabled && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/")}`);
      return;
    }

    const teamA = teamAInput.trim() || "Team A";
    const teamB = teamBInput.trim() || "Team B";
    setCreating(true);
    try {
      const res = await fetch("/api/create-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA, teamB }),
      });
      const data = await res.json();
      if (!data?.matchId) throw new Error("failed");
      closeCreateForm();
      router.push(`/admin/${data.matchId}`);
    } catch (err) {
      console.error("❌", err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (matchId: string) => {
    setDeletingId(matchId);
    try {
      await fetch("/api/matches/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
    } catch {}
    finally { setDeletingId(null); }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--bg-base)",
        backgroundImage: "var(--page-hero-gradient)",
        color: "var(--text-1)",
      }}
    >
      <div className="mx-auto w-full max-w-[1100px] px-4 py-8 md:px-6">

        {/* ── Top bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-1)" }}
            >
              CricSmart
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-3)" }}
            >
              Real-Time Cricket Intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
  <ThemeToggle />

  <Link
    href="/matches"
    className="text-sm px-4 py-2 rounded-lg transition-colors"
    style={{
      background: "var(--bg-surface)",
      color: "var(--text-2)",
      border: "1px solid var(--border-subtle)",
    }}
  >
    All Matches
  </Link>

  <div className="relative" ref={formRef}>
              {(!authLoading && authEnabled && !isAuthenticated) ? (
                <Link
                  href={`/login?redirect=${encodeURIComponent("/")}`}
                  className="text-sm px-4 py-2 rounded-lg transition-colors"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--text-2)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  Sign in to host
                </Link>
              ) : (
                <button
                  onClick={() => setShowCreateForm((v) => !v)}
                  className="text-sm px-4 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    background: "var(--brand)",
                    color: "var(--text-inv)",
                  }}
                >
                  + New Simulation
                </button>
              )}

              {/* Create form dropdown */}
              {showCreateForm && (
                <div
                  className="absolute right-0 top-full mt-2 z-50 rounded-xl p-4 w-64 shadow-xl"
                  style={{
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <p
                    className="text-sm font-semibold mb-3"
                    style={{ color: "var(--text-1)" }}
                  >
                    New Simulation
                  </p>
                  <div className="space-y-2.5">
                    <div>
                      <label
                        className="text-[11px] uppercase tracking-[0.12em] block mb-1"
                        style={{ color: "var(--text-3)" }}
                      >
                        Team A
                      </label>
                      <input
                        type="text"
                        value={teamAInput}
                        onChange={(e) => setTeamAInput(e.target.value)}
                        placeholder="e.g. India"
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
                        style={{
                          background: "var(--bg-overlay)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-1)",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        className="text-[11px] uppercase tracking-[0.12em] block mb-1"
                        style={{ color: "var(--text-3)" }}
                      >
                        Team B
                      </label>
                      <input
                        type="text"
                        value={teamBInput}
                        onChange={(e) => setTeamBInput(e.target.value)}
                        placeholder="e.g. Australia"
                        onKeyDown={(e) => e.key === "Enter" && handleCreateMatch()}
                        className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                        style={{
                          background: "var(--bg-overlay)",
                          border: "1px solid var(--border-subtle)",
                          color: "var(--text-1)",
                        }}
                      />
                    </div>
                    <button
                      onClick={handleCreateMatch}
                      disabled={creating}
                      className="w-full rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
                      style={{ background: "var(--brand)", color: "var(--text-inv)" }}
                    >
                      {creating ? "Creating…" : "Create & Open"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Hero bar ──────────────────────────────────── */}
        {liveMatches.length === 0 && (
          <section
            className="mb-6 rounded-2xl p-5 md:p-6"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--text-3)" }}>
                  Matchday hub
                </p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: "var(--text-1)" }}>
                  No live matches right now
                </h2>
                <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
                  Start a simulation or browse upcoming fixtures while you wait.
                </p>
              </div>
              <Link
                href="/matches"
                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                style={{ background: "var(--brand)", color: "var(--text-inv)" }}
              >
                Explore fixtures
              </Link>
            </div>
          </section>
        )}

        {/* ── Platform stats bar ────────────────────────── */}
        <section
          className="mb-10 grid gap-3 rounded-2xl p-4 sm:grid-cols-3"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <LiveMatchDropdown count={liveMatchCount} matches={liveHostedMatches} />
          <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-overlay)" }}>
            <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
              Teams
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: "var(--text-1)" }}>
              {teamCount}
            </p>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-overlay)" }}>
            <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
              Hosted matches
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: "var(--text-1)" }}>
              {totalMatchCount}
            </p>
          </div>
        </section>

        {/* ── Live Now ─────────────────────────────────── */}
        <section
          className="mb-10 rounded-2xl p-5 md:p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <h2
                className="text-sm font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--text-2)" }}
              >
                Live Now
              </h2>
              {liveMatches.length > 0 && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full tabular-nums"
                  style={{ background: "var(--danger-light)", color: "var(--danger)" }}
                >
                  {liveMatches.length}
                </span>
              )}
            </div>
            <Link
              href="/matches"
              className="text-xs transition-colors"
              style={{ color: "var(--text-3)" }}
            >
              View all →
            </Link>
          </div>

          {liveStale && (
            <p
              className="text-[11px] mb-3"
              style={{ color: "var(--accent)" }}
            >
              ⚠ Scores may be delayed
            </p>
          )}

          {liveMatches.length === 0 ? (
            <div
              className="rounded-xl px-4 py-6 text-sm text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-3)",
              }}
            >
              No live matches right now. Check back soon.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {liveMatches.slice(0, 6).map((m) => (
                <LiveMatchCard key={m.id} match={m} />
              ))}
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="mb-10" />

        {/* ── Your Simulations ─────────────────────────── */}
        <section
          className="rounded-2xl p-5 md:p-6"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--text-2)" }}
            >
              Your Simulations
            </h2>
            {matches.length > 0 && (
              <span
                className="text-[11px] tabular-nums"
                style={{ color: "var(--text-3)" }}
              >
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          {matches.length === 0 ? (
            <div
              className="rounded-xl px-4 py-8 text-center"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <p
                className="text-sm mb-3"
                style={{ color: "var(--text-3)" }}
              >
                No simulations yet.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-sm px-4 py-2 rounded-lg font-medium"
                style={{ background: "var(--brand)", color: "var(--text-inv)" }}
              >
                + Create your first simulation
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <SimulationRow
                  key={m.matchId}
                  match={m}
                  onDelete={() => handleDelete(m.matchId)}
                  isDeleting={deletingId === m.matchId}
                />
              ))}
            </div>
          )}
        </section>

        {isLoggedIn && (
          <>
            {/* ── Quick actions ───────────────────────────── */}
            <section
              className="mt-10 rounded-2xl p-5 md:p-6"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="text-sm font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-2)" }}
                >
                  Quick actions
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link
                  href="/host/matches/create"
                  className="rounded-xl px-4 py-3 text-sm transition-colors"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                >
                  Host Match
                </Link>
                <Link
                  href="/account/teams"
                  className="rounded-xl px-4 py-3 text-sm transition-colors"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                >
                  Manage Teams
                </Link>
                <Link
                  href="/account/tournaments"
                  className="rounded-xl px-4 py-3 text-sm transition-colors"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                >
                  Tournaments
                </Link>
                <Link
                  href="/account/saved"
                  className="rounded-xl px-4 py-3 text-sm transition-colors"
                  style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-subtle)" }}
                >
                  Saved Items
                </Link>
              </div>
            </section>

            {/* ── Recent activity snapshot ───────────────── */}
            <section
              className="mt-6 rounded-2xl p-5 md:p-6"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="text-sm font-semibold uppercase tracking-[0.18em]"
                  style={{ color: "var(--text-2)" }}
                >
                  Recent activity snapshot
                </h2>
                <Link href="/account/activity" className="text-xs" style={{ color: "var(--text-3)" }}>
                  Open feed →
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-overlay)" }}>
                  <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
                    Live now
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: "var(--text-1)" }}>
                    {liveMatches.length}
                  </p>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-overlay)" }}>
                  <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
                    Simulations
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums" style={{ color: "var(--text-1)" }}>
                    {matches.length}
                  </p>
                </div>
                <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-overlay)" }}>
                  <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
                    Feed status
                  </p>
                  <p className="mt-1 text-sm font-medium" style={{ color: liveStale ? "var(--accent)" : "var(--text-1)" }}>
                    {liveStale ? "Delayed data" : "Up to date"}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  );
}
