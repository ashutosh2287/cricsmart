"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";

type ScoreEntry = {
  r?: number;
  w?: number;
  o?: number;
  inning?: string;
};

type CricApiMatch = {
  id: string;
  name?: string;
  matchType?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  teamInfo?: { name?: string; shortname?: string; img?: string }[];
  score?: ScoreEntry[];
  matchStarted?: boolean;
  matchEnded?: boolean;
  matchCategory?: string;
  isLive?: boolean;
  isCompleted?: boolean;
};

function formatScore(entry: ScoreEntry): string {
  const runs = entry.r ?? 0;
  const wickets = entry.w ?? 0;
  const overs = entry.o ?? 0;
  return `${runs}/${wickets} (${overs} ov)`;
}

export default function RealMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [match, setMatch] = useState<CricApiMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = (await res.json()) as {
          data?: CricApiMatch[];
          stale?: boolean;
        };
        if (cancelled) return;

        if (payload.stale) setStale(true);

        const found = (payload.data ?? []).find((m) => m.id === id);
        if (found) {
          setMatch(found);
          setError(null);
        } else {
          setError("Match not found or no longer live.");
        }
      } catch {
        if (!cancelled) setError("Unable to load match data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-6 text-white">
        <div className="animate-pulse space-y-4 max-w-2xl">
          <div className="h-8 w-2/3 bg-gray-800 rounded" />
          <div className="h-5 w-1/3 bg-gray-800 rounded" />
          <div className="h-24 w-full bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="p-6 text-white">
        <Link href="/matches" className="text-sm text-blue-400 hover:underline mb-4 inline-block">
          ← Back to matches
        </Link>
        <p className="text-gray-400 mt-4">{error ?? "Match not found."}</p>
      </div>
    );
  }

  const teamA = match.teamInfo?.[0]?.name ?? match.teams?.[0] ?? "Team A";
  const teamB = match.teamInfo?.[1]?.name ?? match.teams?.[1] ?? "Team B";
  const category = match.matchCategory ?? match.matchType?.toUpperCase() ?? "T20";
  const scores = Array.isArray(match.score) ? match.score : [];
  const dateStr = match.dateTimeGMT ?? match.date;

  return (
    <div className="p-6 text-white max-w-3xl mx-auto">
      <Link href="/matches" className="text-sm text-blue-400 hover:underline mb-6 inline-block">
        ← Back to matches
      </Link>

      {stale && (
        <div className="mb-4 px-3 py-2 bg-amber-900/30 border border-amber-500/30 rounded-lg text-xs text-amber-300">
          Scores may be delayed
        </div>
      )}

      <div className="bg-bg-surface border border-white/10 rounded-2xl p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold">
            {teamA} vs {teamB}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-zinc-800 text-gray-300 uppercase">
              {category}
            </span>
            {match.isLive && (
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                </span>
                LIVE
              </span>
            )}
            {match.isCompleted && (
              <span className="text-xs text-gray-400 uppercase">Completed</span>
            )}
            {!match.isLive && !match.isCompleted && (
              <span className="text-xs text-blue-400 uppercase">Upcoming</span>
            )}
          </div>
        </div>

        {/* Status */}
        {match.status && (
          <p className="text-sm text-gray-300 mb-3">{match.status}</p>
        )}

        {/* Scores */}
        {scores.length > 0 && (
          <div className="space-y-2 mb-4">
            {scores.map((entry, i) => (
              <div key={i} className="bg-zinc-900/60 rounded-lg px-4 py-3">
                {entry.inning && (
                  <p className="text-xs text-gray-400 mb-1">{entry.inning}</p>
                )}
                <p className="text-lg font-semibold font-mono">{formatScore(entry)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Venue & Date */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-400 mt-4 pt-4 border-t border-white/5">
          {match.venue && <span>📍 {match.venue}</span>}
          {dateStr && (
            <span>
              🗓{" "}
              {new Date(dateStr).toLocaleDateString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 mt-4 text-center">
        Data from CricAPI · Updates every 30s
      </p>
    </div>
  );
}
