"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CuratedMatch } from "@/services/matches/types";
import { MatchMetaRow } from "./MatchMetaRow";
import { MatchStatusPill } from "./MatchStatusPill";
import type { LiveMatchInitResponse } from "@/types/liveSession";

function formatScore(r?: number, w?: number, o?: number): string {
  return `${r ?? 0}/${w ?? 0} (${o ?? 0} ov)`;
}

export function MatchCardLive({ match }: { match: CuratedMatch }) {
  const router = useRouter();
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamA = useMemo(() => match.teams?.[0]?.name ?? "Team A", [match.teams]);
  const teamB = useMemo(() => match.teams?.[1]?.name ?? "Team B", [match.teams]);

  async function openLiveMatch() {
    if (isInitializing) return;

    setIsInitializing(true);
    setError(null);
    const internalMatchId = `live_${match.id}`;

    try {
      const res = await fetch("/api/match/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: internalMatchId,
          externalMatchId: match.id,
          teamA,
          teamB,
          type: "LIVE",
          seriesName: match.seriesName,
          format: match.format,
          scheduledStart: match.startTime,
        }),
      });

      const body = (await res.json()) as Partial<LiveMatchInitResponse> & {
        message?: string;
        matchId?: string;
      };

      if (!res.ok || !body.success) {
        throw new Error(body.message || "Session bootstrap failed");
      }

      const redirectId = body.matchId ?? body.slug ?? internalMatchId;
      router.push(`/match/${redirectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to initialize live session");
      setIsInitializing(false);
    }
  }

  return (
    <article className="w-[260px] shrink-0 rounded-lg border border-red-500/25 bg-zinc-900/85 p-3 transition-colors hover:border-red-400/40">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-100">{match.title}</h3>
        <MatchStatusPill status={match.status} />
      </div>

      {match.score.length > 0 ? (
        <div className="space-y-1 text-xs font-mono text-zinc-200">
          {match.score.slice(0, 2).map((entry, idx) => (
            <p key={idx} className="line-clamp-1">
              {entry.inning ? <span className="text-zinc-400">{entry.inning}: </span> : null}
              {formatScore(entry.r, entry.w, entry.o)}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-zinc-400">Live updates incoming</p>
      )}

      <MatchMetaRow match={match} />

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={openLiveMatch}
          disabled={isInitializing}
          className="w-full rounded-md bg-red-500/90 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isInitializing ? "Initializing live session…" : "Open Live Match"}
        </button>

        {error ? (
          <div className="rounded-md border border-red-500/30 bg-red-950/40 px-3 py-2 text-xs text-red-200">
            {error}
          </div>
        ) : null}
      </div>
    </article>
  );
}
