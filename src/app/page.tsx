"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { LivePulse } from "@/components/matches/LivePulse";
import { importanceTierClassMap, type ImportanceTier } from "@/animations/live-energy";

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
type FeedTone = "wicket" | "momentum" | "pressure" | "boundary" | "partnership" | "turning";
type LiveFeedEvent = {
  id: string;
  title: string;
  detail: string;
  tone: FeedTone;
  tier: ImportanceTier;
};

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
  if (c === "IPL") return { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" };
  if (c === "TEST") return { bg: "rgba(239,68,68,0.12)", color: "#ef4444" };
  if (c === "ODI") return { bg: "rgba(34,197,94,0.12)", color: "#22c55e" };
  if (c.includes("T20")) return { bg: "rgba(59,130,246,0.12)", color: "#60a5fa" };
  return {
    bg: "color-mix(in srgb, var(--text-primary) 8%, transparent)",
    color: "var(--text-secondary)",
  };
}

function runRate(entry?: ScoreEntry) {
  const overs = entry?.o ?? 0;
  const runs = entry?.r ?? 0;
  if (!overs) return 0;
  return runs / overs;
}

function buildLiveFeed(matches: RealMatch[]): LiveFeedEvent[] {
  const events: LiveFeedEvent[] = [];

  matches.forEach((match) => {
    const [teamA, teamB] = getTeamNames(match);
    const scores = Array.isArray(match.score) ? match.score : [];
    const first = scores[0];
    const second = scores[1];
    const secondRunRate = runRate(second);
    const firstRunRate = runRate(first);
    const chaseGap = (first?.r ?? 0) - (second?.r ?? 0);
    const secondWickets = second?.w ?? 0;

    if (second && secondWickets >= 5) {
      events.push({
        id: `${match.id}-collapse`,
        title: `${teamB} wobble`,
        detail: `${teamB} are ${second.r ?? 0}/${secondWickets}. Collapse risk rising.`,
        tone: "wicket",
        tier: 3,
      });
    }

    if (second && chaseGap > 0 && chaseGap <= 20 && secondWickets <= 6) {
      events.push({
        id: `${match.id}-close-chase`,
        title: "Close chase alert",
        detail: `${teamB} need ${chaseGap} more. Match pressure peaking.`,
        tone: "pressure",
        tier: 2,
      });
    }

    if (Math.max(firstRunRate, secondRunRate) >= 9) {
      events.push({
        id: `${match.id}-momentum`,
        title: "Momentum surge",
        detail: `${teamA} vs ${teamB} scoring rate has accelerated.`,
        tone: "momentum",
        tier: 2,
      });
    }

    if ((first?.w ?? 0) <= 2 && (first?.r ?? 0) >= 70) {
      events.push({
        id: `${match.id}-partnership`,
        title: "Active partnership",
        detail: `${teamA} are building a stable stand with low wicket loss.`,
        tone: "partnership",
        tier: 2,
      });
    }

    if (scores.some((entry) => runRate(entry) >= 11)) {
      events.push({
        id: `${match.id}-boundary-run`,
        title: "Boundary phase",
        detail: "Recent over tempo suggests boundary-heavy scoring.",
        tone: "boundary",
        tier: 2,
      });
    }

    if ((first?.w ?? 0) >= 3 || (second?.w ?? 0) >= 3) {
      events.push({
        id: `${match.id}-turning`,
        title: "Turning-point watch",
        detail: "Wicket clusters indicate a potential match swing.",
        tone: "turning",
        tier: 3,
      });
    }
  });

  return events.slice(0, 8);
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
          <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#ef4444" }}>
            <LivePulse />
            LIVE
          </span>
        </div>

        {/* Teams */}
        <p
          className="text-sm font-semibold mb-2 leading-snug"
          style={{ color: "var(--text-primary)" }}
        >
          {teamA}
          <span style={{ color: "var(--text-muted)" }}> vs </span>
          {teamB}
        </p>

        {/* Scores */}
        {scores.length > 0 && (
          <div className="space-y-0.5">
            {scores.slice(0, 2).map((s, i) => (
              <p
                key={i}
                className="text-xs tabular-nums font-mono"
                style={{ color: "var(--text-secondary)" }}
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
            style={{ color: "var(--text-muted)" }}
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
      ? "var(--accent-live)"
      : match.status === "Completed"
      ? "var(--text-muted)"
      : "var(--accent-brand)";

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
          <span className="shrink-0">
            <LivePulse />
          </span>
        )}

        <span
          className="font-medium text-sm truncate"
          style={{ color: "var(--text-primary)" }}
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
            color: "var(--text-secondary)",
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
            color: "var(--text-muted)",
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

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<RealMatch[]>([]);
  const [liveStale, setLiveStale] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamAInput, setTeamAInput] = useState("");
  const [teamBInput, setTeamBInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();
  const liveFeed = useMemo(() => buildLiveFeed(liveMatches), [liveMatches]);

  function closeCreateForm() {
    setShowCreateForm(false);
    setTeamAInput("");
    setTeamBInput("");
    setCreateError(null);
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

  // Close create form on escape
  useEffect(() => {
    if (!showCreateForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCreateForm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showCreateForm]);

  const handleCreateMatch = async () => {
    const teamA = teamAInput.trim() || "Team A";
    const teamB = teamBInput.trim() || "Team B";
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/create-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA, teamB }),
      });
      if (!res.ok) {
        const details = await res.text().catch(() => "");
        throw new Error(details || `status ${res.status}`);
      }
      const data = await res.json();
      if (!data?.matchId) throw new Error("failed");
      closeCreateForm();
      router.push(`/match/${data.matchId}?tab=admin`);
    } catch (err) {
      console.error("❌", err);
      setCreateError(err instanceof Error ? err.message : "Failed to create match.");
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
        color: "var(--text-primary)",
      }}
    >
      <div className="mx-auto w-full max-w-[1180px] px-3 py-5 md:px-4 sports-density">

        {/* ── Top bar ──────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              CricSmart
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Real-Time Cricket Intelligence
            </p>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/matches"
              className="interactive-sports text-sm px-3.5 py-1.5 rounded-lg transition-colors"
              style={{
                background: "var(--bg-surface)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              All Matches
            </Link>
          </div>
        </div>

        {/* ── Live Now ─────────────────────────────────── */}
        <section
          className="hierarchy-primary mb-6 rounded-2xl p-4 md:p-5"
          style={{
            background: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LivePulse />
              <h2
                className="text-sm font-semibold uppercase tracking-[0.18em]"
                style={{ color: "var(--text-secondary)" }}
              >
                Live Now
              </h2>
              {liveMatches.length > 0 && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full tabular-nums"
                  style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}
                >
                  {liveMatches.length}
                </span>
              )}
            </div>
            <Link
              href="/matches"
              className="text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              View all →
            </Link>
          </div>

          {liveStale && (
            <p
              className="text-[11px] mb-3"
              style={{ color: "var(--accent-amber)" }}
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
                color: "var(--text-muted)",
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
        <div className="sports-separator mb-4" />

        <section className="hierarchy-secondary rounded-2xl p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Live Sports Feed
            </h2>
            <span className="text-[11px] text-[var(--text-muted)]">Event-driven narrative</span>
          </div>

          {liveFeed.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-4 text-sm text-[var(--text-muted)]">
              Awaiting live events…
            </div>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2">
              {liveFeed.map((event) => {
                const tierClass = importanceTierClassMap[event.tier];
                const toneClass =
                  event.tone === "wicket"
                    ? "state-wicket"
                    : event.tone === "momentum"
                    ? "state-momentum"
                    : event.tone === "pressure"
                    ? "state-pressure"
                    : event.tone === "boundary"
                    ? "state-boundary"
                    : event.tone === "partnership"
                    ? "state-partnership"
                    : "state-collapse";

                return (
                  <div
                    key={event.id}
                    className={`rounded-xl border bg-[var(--bg-surface)] px-3 py-2.5 ${tierClass.borderClass} ${tierClass.glowClass}`}
                  >
                    <p className={`text-[11px] uppercase tracking-[0.16em] ${toneClass}`}>{event.title}</p>
                    <p className={`mt-1 text-sm text-[var(--text-primary)] ${tierClass.textClass}`}>{event.detail}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="sports-separator mb-4" />

        {/* ── Your Simulations ─────────────────────────── */}
        <section
          className="hierarchy-secondary rounded-2xl p-4 md:p-5"
          style={{
            background: "var(--bg-surface)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-sm font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--text-secondary)" }}
            >
              Your Simulations
            </h2>
            {matches.length > 0 && (
              <span
                className="text-[11px] tabular-nums"
                style={{ color: "var(--text-muted)" }}
              >
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          {matches.length === 0 ? (
            <div
              className="rounded-xl px-4 py-6"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {!showCreateForm ? (
                <div className="text-center">
                  <p
                    className="text-sm mb-3"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No simulations yet.
                  </p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="text-sm px-4 py-2 rounded-lg font-medium"
                    style={{ background: "var(--accent-brand)", color: "#fff" }}
                  >
                    + Create your first simulation
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
                    New Simulation
                  </p>
                  <div>
                    <label
                      className="text-[11px] uppercase tracking-[0.12em] block mb-1"
                      style={{ color: "var(--text-muted)" }}
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
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="text-[11px] uppercase tracking-[0.12em] block mb-1"
                      style={{ color: "var(--text-muted)" }}
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
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCreateMatch}
                      disabled={creating}
                      className="interactive-sports flex-1 rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
                      style={{ background: "var(--accent-brand)", color: "#fff" }}
                    >
                      {creating ? "Creating…" : "Create & Open"}
                    </button>
                    <button
                      onClick={closeCreateForm}
                      className="rounded-lg px-3 py-2 text-sm"
                      style={{
                        background: "var(--bg-overlay)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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

        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowCreateForm(true)}
            className="interactive-sports rounded-full px-4 py-2 text-sm font-semibold shadow-lg"
            style={{
              background: "var(--accent-brand)",
              color: "#fff",
            }}
          >
            + Create Simulation
          </button>
        </div>

        {showCreateForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(2, 6, 23, 0.7)" }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !creating) closeCreateForm();
            }}
          >
            <div
              className="rounded-xl p-4 w-full max-w-sm shadow-xl"
              style={{
                background: "var(--bg-raised)",
                border: "1px solid var(--border-subtle)",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  New Simulation
                </p>
                <button
                  type="button"
                  onClick={closeCreateForm}
                  disabled={creating}
                  className="text-sm px-2 py-1 rounded-md disabled:opacity-60"
                  style={{
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2.5">
                <div>
                  <label
                    className="text-[11px] uppercase tracking-[0.12em] block mb-1"
                    style={{ color: "var(--text-muted)" }}
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
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label
                    className="text-[11px] uppercase tracking-[0.12em] block mb-1"
                    style={{ color: "var(--text-muted)" }}
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
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <button
                  onClick={handleCreateMatch}
                  disabled={creating}
                  className="interactive-sports w-full rounded-lg py-2 text-sm font-semibold transition-opacity disabled:opacity-60"
                  style={{ background: "var(--accent-brand)", color: "#fff" }}
                >
                  {creating ? "Creating…" : "Create & Open"}
                </button>
                {createError && (
                  <p className="text-xs" style={{ color: "#fda4af" }}>
                    {createError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
