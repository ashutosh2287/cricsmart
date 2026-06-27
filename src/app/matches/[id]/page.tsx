"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { CuratedMatch } from "@/services/matches/types";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import MatchStatusBadge from "@/components/ui/MatchStatusBadge";
import ScoreDisplay from "@/components/ui/ScoreDisplay";
import { MapPin, Calendar, Trophy, Clock, ArrowLeft } from "lucide-react";

type Payload = {
  data?: CuratedMatch[];
  stale?: boolean;
};

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
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-3)]" />
          <div className="h-8 w-2/3 animate-pulse rounded bg-[var(--surface-3)]" />
          <div className="h-32 w-full animate-pulse rounded-xl bg-[var(--surface-3)]" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-lg bg-[var(--surface-3)]" />
            <div className="h-24 animate-pulse rounded-lg bg-[var(--surface-3)]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="p-6 text-[var(--text-1)]">
        <Link href="/matches" className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--brand)] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to matches
        </Link>
        <p className="mt-4 text-[var(--text-2)]">{error ?? "Match not found."}</p>
      </div>
    );
  }

  const teamA = match.teams?.[0]?.name ?? "Team A";
  const teamB = match.teams?.[1]?.name ?? "Team B";
  const format = match.uiBadge ?? match.format ?? "T20";

  return (
    <div className="mx-auto max-w-3xl p-6 text-[var(--text-1)]">
      <Breadcrumbs items={[{ label: "Matches", href: "/matches" }, { label: `${teamA} vs ${teamB}` }]} />

      {stale && (
        <div className="mt-4 mb-4 rounded-lg border border-[var(--amber)]/30 bg-[var(--amber-light)] px-3 py-2 text-xs text-[var(--amber)]">
          Scores may be delayed
        </div>
      )}

      {/* Match Header Card */}
      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Match Status Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-[var(--surface)] border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--surface-3)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-2)]">
              {format}
            </span>
            <MatchStatusBadge status={match.status === "live" ? "live" : match.status === "completed" ? "completed" : "upcoming"} />
          </div>
          {match.status === "live" && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--danger)]">
              <Clock className="w-3 h-3" />
              <span>Live</span>
            </div>
          )}
        </div>

        {/* Team Comparison */}
        <div className="px-6 py-8">
          <div className="grid grid-cols-3 gap-4 items-center text-center">
            {/* Team A */}
            <div>
              <p className="text-lg font-bold mb-1">{teamA}</p>
              {match.score[0] && (
                <ScoreDisplay
                  runs={match.score[0].r ?? 0}
                  wickets={match.score[0].w ?? 0}
                  overs={match.score[0].o}
                  size="md"
                  className="justify-center"
                />
              )}
            </div>

            {/* VS */}
            <div>
              <span className="text-xs text-[var(--text-3)] uppercase tracking-wider font-semibold">vs</span>
            </div>

            {/* Team B */}
            <div>
              <p className="text-lg font-bold mb-1">{teamB}</p>
              {match.score[1] && (
                <ScoreDisplay
                  runs={match.score[1].r ?? 0}
                  wickets={match.score[1].w ?? 0}
                  overs={match.score[1].o}
                  size="md"
                  className="justify-center"
                />
              )}
            </div>
          </div>

          {match.statusText && (
            <p className="mt-4 text-sm text-[var(--text-2)] text-center">{match.statusText}</p>
          )}
        </div>

        {/* Innings Breakdown */}
        {match.score.length > 0 && (
          <div className="border-t border-[var(--border)]">
            {match.score.map((entry, i) => (
              <div key={i} className={`px-6 py-3 flex items-center justify-between ${i < match.score.length - 1 ? "border-b border-[var(--border)]" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded bg-[var(--surface-3)] flex items-center justify-center text-[10px] font-bold text-[var(--text-3)]">
                    {i + 1}
                  </span>
                  <div>
                    {entry.inning && <p className="text-xs text-[var(--text-3)]">{entry.inning}</p>}
                  </div>
                </div>
                <ScoreDisplay
                  runs={entry.r ?? 0}
                  wickets={entry.w ?? 0}
                  overs={entry.o}
                  size="sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Match Info */}
        <div className="border-t border-[var(--border)] px-6 py-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-[var(--text-2)]">
            {match.seriesName && (
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                {match.seriesName}
              </span>
            )}
            {match.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {match.venue}
              </span>
            )}
            {match.startTime && !Number.isNaN(new Date(match.startTime).getTime()) && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
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
      </div>

      <p className="mt-4 text-center text-xs text-[var(--text-3)]">Updates every 30s</p>
    </div>
  );
}
