"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────────

type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";
type SimMatch = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  type: string;
  externalMatchId?: string;
  score?: string;
  overDisplay?: string;
  commentaryPreview?: string;
  heartbeatFresh?: boolean;
  reconnectHealth?: "healthy" | "stale" | "disconnected";
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

type RealFilterTab = "ALL" | "LIVE" | "IPL" | "INTERNATIONAL" | "DOMESTIC";
type SimFilterTab = "ALL" | "LIVE" | "UPCOMING" | "COMPLETED";

// ── Constants ────────────────────────────────────────────────────────────────

const FIXTURE_POLL_INTERVAL_MS = 60_000;
const INTERNATIONAL_CATEGORIES = ["TEST", "ODI", "T20I"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null;
  return value as Record<string, unknown>;
}

function extractRealMatches(payload: unknown): RealMatch[] {
  if (!payload || typeof payload !== "object") return [];
  const record = asRecord(payload);
  if (!record) return [];
  if (Array.isArray(record.data)) return record.data as RealMatch[];
  return [];
}

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

function formatScoreEntry(entry: ScoreEntry): string {
  const runs = entry.r ?? 0;
  const wickets = entry.w ?? 0;
  const overs = entry.o ?? 0;
  return `${runs}/${wickets} (${overs} ov)`;
}

function getCategoryBadgeClass(category: string): string {
  if (category === "IPL") return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
  if (category === "TEST") return "bg-purple-500/20 text-purple-300 border-purple-500/30";
  if (category === "ODI") return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  if (category === "T20I") return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
  if (category === "DOMESTIC") return "bg-green-500/20 text-green-300 border-green-500/30";
  return "bg-zinc-700/50 text-gray-300 border-zinc-600/30";
}

// ── Main component ────────────────────────────────────────────────────────────

export default function MatchesPage() {
  // Real matches (cricAPI)
  const [realMatches, setRealMatches] = useState<RealMatch[]>([]);
  const [realLoading, setRealLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [realFilter, setRealFilter] = useState<RealFilterTab>("ALL");
  const realSnapshotRef = useRef<RealMatch[]>([]);

  // Simulated matches
  const [simMatches, setSimMatches] = useState<SimMatch[]>([]);
  const [simLoading, setSimLoading] = useState(true);
  const [simFilter, setSimFilter] = useState<SimFilterTab>("ALL");

  const router = useRouter();

  // ── Fetch real matches ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = (await res.json()) as { data?: RealMatch[]; stale?: boolean };
        if (cancelled) return;

        if (payload.stale) {
          setStale(true);
        } else {
          setStale(false);
        }

        const matches = extractRealMatches(payload);
        setRealMatches(matches);
        realSnapshotRef.current = matches;
      } catch {
        if (cancelled) return;
        if (realSnapshotRef.current.length > 0) {
          setRealMatches(realSnapshotRef.current);
          setStale(true);
        } else {
          setRealMatches([]);
        }
      } finally {
        if (!cancelled) setRealLoading(false);
      }
    };

    load();
    const timer = setInterval(load, FIXTURE_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // ── Fetch simulated matches ─────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        const data = (await res.json()) as SimMatch[];
        if (!cancelled) setSimMatches(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setSimMatches([]);
      } finally {
        if (!cancelled) setSimLoading(false);
      }
    };

    load();
    const timer = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  // ── Filter real matches ─────────────────────────────────────────────────────

  const filteredReal = useMemo(() => {
    if (realFilter === "ALL") return realMatches;
    if (realFilter === "LIVE") return realMatches.filter((m) => m.isLive);
    if (realFilter === "IPL") return realMatches.filter((m) => m.matchCategory === "IPL");
    if (realFilter === "INTERNATIONAL")
      return realMatches.filter((m) =>
        INTERNATIONAL_CATEGORIES.includes(m.matchCategory ?? "")
      );
    if (realFilter === "DOMESTIC") return realMatches.filter((m) => m.matchCategory === "DOMESTIC");
    return realMatches;
  }, [realMatches, realFilter]);

  // ── Filter sim matches ──────────────────────────────────────────────────────

  const filteredSim = useMemo(() => {
    if (simFilter === "ALL") return simMatches;
    return simMatches.filter((m) => m.status === simFilter);
  }, [simMatches, simFilter]);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 text-white max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Matches</h1>

      {/* ── SECTION 1: Real matches ── */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-100">Live Now</h2>
          <span className="text-xs text-gray-500">Auto-refresh: 60s</span>
        </div>

        {stale && (
          <div className="mb-3 px-3 py-2 bg-amber-900/30 border border-amber-500/30 rounded-lg text-xs text-amber-300">
            Scores may be delayed
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(["ALL", "LIVE", "IPL", "INTERNATIONAL", "DOMESTIC"] as RealFilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRealFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                realFilter === tab
                  ? "border-blue-400 text-blue-300"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "LIVE" ? "LIVE 🔴" : tab}
            </button>
          ))}
        </div>

        {realLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-gray-900/70 border border-gray-800 p-4 rounded-xl animate-pulse">
                <div className="h-5 w-2/3 bg-gray-700 rounded mb-3" />
                <div className="h-4 w-1/2 bg-gray-700 rounded mb-2" />
                <div className="h-4 w-3/4 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : filteredReal.length === 0 ? (
          <p className="text-gray-500">No live matches right now. Check back soon.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReal.map((match) => (
              <RealMatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* ── SECTION 2: Simulated matches ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Your Simulations</h2>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 flex-wrap">
          {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as SimFilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setSimFilter(tab)}
              className={`px-4 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                simFilter === tab
                  ? "border-purple-400 text-purple-300"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {tab === "LIVE" ? "LIVE 🔴" : tab}
            </button>
          ))}
        </div>

        {simLoading ? (
          <p className="text-gray-400">Loading simulations...</p>
        ) : filteredSim.length === 0 ? (
          <p className="text-gray-500">No simulations available.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSim.map((match) => (
              <SimMatchCard
                key={match.matchId}
                match={match}
                onClick={async () => {
                  await fetch("/api/match/init", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      matchId: match.matchId,
                      teamA: match.teamA,
                      teamB: match.teamB,
                      type: match.type,
                      externalMatchId: match.externalMatchId ?? match.matchId,
                    }),
                  });
                  router.push(`/match/${match.matchId}`);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── RealMatchCard ─────────────────────────────────────────────────────────────

function RealMatchCard({ match }: { match: RealMatch }) {
  const [teamA, teamB] = getTeamNames(match);
  const category = match.matchCategory ?? match.matchType?.toUpperCase() ?? "T20";
  const scores = Array.isArray(match.score) ? match.score : [];
  const dateStr = match.dateTimeGMT ?? match.date;

  return (
    <Link href={`/matches/${match.id}`}>
      <div
        className={`bg-bg-surface border rounded-xl p-4 hover:border-white/20 transition-all cursor-pointer h-full ${
          match.isLive
            ? "border-red-500/40 live-cinematic"
            : match.isCompleted
            ? "border-white/5 completed-cinematic"
            : "border-white/10 upcoming-cinematic"
        }`}
      >
        {/* Teams + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-sm leading-tight">
            {teamA} vs {teamB}
          </p>
          {match.isLive ? (
            <span className="flex items-center gap-1.5 text-xs text-red-400 shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              LIVE
            </span>
          ) : match.isCompleted ? (
            <span className="text-xs text-gray-500 shrink-0">Completed</span>
          ) : (
            <span className="text-xs text-blue-400 shrink-0">Upcoming</span>
          )}
        </div>

        {/* Category badge */}
        <span
          className={`inline-block text-xs px-2 py-0.5 rounded border font-medium mb-3 ${getCategoryBadgeClass(
            category
          )}`}
        >
          {category}
        </span>

        {/* Scores */}
        {scores.length > 0 ? (
          <div className="space-y-1 mb-3">
            {scores.map((entry, i) => (
              <p key={i} className="text-sm font-mono text-gray-200">
                {entry.inning ? (
                  <span className="text-xs text-gray-400">{entry.inning}: </span>
                ) : null}
                {formatScoreEntry(entry)}
              </p>
            ))}
          </div>
        ) : null}

        {/* Status text */}
        {match.status && (
          <p className="text-xs text-gray-400 truncate mb-2">{match.status}</p>
        )}

        {/* Venue + date */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-auto pt-2 border-t border-white/5">
          {match.venue && <span className="truncate">📍 {match.venue}</span>}
          {dateStr && (
            <span>
              🗓{" "}
              {new Date(dateStr).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── SimMatchCard ──────────────────────────────────────────────────────────────

type SimMatchCardProps = { match: SimMatch; onClick: () => void };

function SimMatchCard({ match, onClick }: SimMatchCardProps) {
  const isLive = match.status === "LIVE";

  return (
    <div
      onClick={onClick}
      className={`bg-bg-surface border rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all ${
        isLive ? "border-red-500/40 live-cinematic" : "border-white/10"
      }`}
    >
      <h3 className="font-semibold text-sm mb-1">
        {match.teamA} vs {match.teamB}
      </h3>

      <span
        className={`inline-flex items-center gap-1.5 text-xs mb-2 ${
          isLive ? "text-red-400" : match.status === "UPCOMING" ? "text-blue-400" : "text-gray-400"
        }`}
      >
        {isLive && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
        {match.status}
      </span>

      {isLive && (
        <p className="text-sm text-gray-300 font-mono">
          {match.score ?? "0/0"} ({match.overDisplay ?? "0.0"})
        </p>
      )}

      {match.commentaryPreview ? (
        <p className="text-xs text-gray-500 mt-1 italic truncate">{match.commentaryPreview}</p>
      ) : null}

      <button className="mt-3 bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-xs font-medium">
        Open Simulation
      </button>
    </div>
  );
}
