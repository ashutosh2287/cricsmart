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
    <article className="w-[260px] shrink-0 rounded-lg border border-[var(--danger)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--danger)]">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-1)]">{match.title}</h3>
        <MatchStatusPill status={match.status} />
      </div>

      {match.score.length > 0 ? (
        <div className="space-y-1 text-xs font-mono text-[var(--text-2)]">
          {match.score.slice(0, 2).map((entry, idx) => (
            <p key={idx} className="line-clamp-1">
              {entry.inning ? <span className="text-[var(--text-3)]">{entry.inning}: </span> : null}
              {formatScore(entry.r, entry.w, entry.o)}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-3)]">Live updates incoming</p>
      )}

      <MatchMetaRow match={match} />

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={openLiveMatch}
          disabled={isInitializing}
          className="w-full rounded-md bg-[var(--danger)] px-3 py-2 text-sm font-medium text-[var(--text-inv)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isInitializing ? "Initializing live session…" : "Open Live Match"}
        </button>

        {error ? (
          <div className="rounded-md border border-[var(--danger)] bg-[var(--danger-light)] px-3 py-2 text-xs text-[var(--danger)]">
            {error}
          </div>
        ) : null}
      </div>
    </article>
  );
}