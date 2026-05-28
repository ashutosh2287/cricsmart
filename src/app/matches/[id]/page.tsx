"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CuratedMatch } from "@/services/matches/types";

type Payload = {
  data?: CuratedMatch[];
  stale?: boolean;
};

function formatScore(r?: number, w?: number, o?: number): string {
  return `${r ?? 0}/${w ?? 0} (${o ?? 0} ov)`;
}

export default function RealMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [match, setMatch] = useState<CuratedMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = (await res.json()) as Payload;
        if (cancelled) return;

        if (payload.stale) setStale(true);
        else setStale(false);

        const found = (payload.data ?? []).find((m) => m.id === id);
        if (found) {
          setMatch(found);
          setError(null);
        } else {
          setError("Match not found or no longer available.");
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
      <div className="p-6 text-[var(--text-1)]">
        <div className="max-w-2xl animate-pulse space-y-4">
          <div className="h-8 w-2/3 rounded bg-[var(--surface-2)]" />
          <div className="h-5 w-1/3 rounded bg-[var(--surface-2)]" />
          <div className="h-24 w-full rounded-xl bg-[var(--surface-2)]" />
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="p-6 text-[var(--text-1)]">
        <Link href="/matches" className="mb-4 inline-block text-sm text-blue-400 hover:underline">
          ← Back to matches
        </Link>
        <p className="mt-4 text-[var(--text-2)]">{error ?? "Match not found."}</p>
      </div>
    );
  }

  const teamA = match.teams?.[0]?.name ?? "Team A";
  const teamB = match.teams?.[1]?.name ?? "Team B";

  return (
    <div className="mx-auto max-w-3xl p-6 text-[var(--text-1)]">
      <Link href="/matches" className="mb-6 inline-block text-sm text-blue-400 hover:underline">
        ← Back to matches
      </Link>

      {stale && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-900/30 px-3 py-2 text-xs text-amber-300">
          Scores may be delayed
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-bg-surface p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold">
            {teamA} vs {teamB}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <span className="rounded bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold uppercase text-[var(--text-2)]">
              {match.uiBadge ?? match.format}
            </span>
            {match.status === "live" && <span className="text-xs uppercase text-red-400">LIVE</span>}
            {match.status === "completed" && <span className="text-xs uppercase text-[var(--text-2)]">Completed</span>}
            {match.status === "upcoming" && <span className="text-xs uppercase text-blue-400">Upcoming</span>}
          </div>
        </div>

        {match.statusText && <p className="mb-3 text-sm text-[var(--text-2)]">{match.statusText}</p>}

        {match.score.length > 0 && (
          <div className="mb-4 space-y-2">
            {match.score.map((entry, i) => (
              <div key={i} className="rounded-lg bg-[var(--surface)]/60 px-4 py-3">
                {entry.inning && <p className="mb-1 text-xs text-[var(--text-2)]">{entry.inning}</p>}
                <p className="font-mono text-lg font-semibold">{formatScore(entry.r, entry.w, entry.o)}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 border-t border-white/5 pt-4 text-xs text-[var(--text-2)]">
          {match.seriesName && <span>🏏 {match.seriesName}</span>}
          {match.venue && <span>📍 {match.venue}</span>}
          {match.startTime && !Number.isNaN(new Date(match.startTime).getTime()) && (
            <span>
              🗓{" "}
              {new Date(match.startTime).toLocaleDateString(undefined, {
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

      <p className="mt-4 text-center text-xs text-[var(--text-3)]">Data from CricAPI · Updates every 30s</p>
    </div>
  );
}
