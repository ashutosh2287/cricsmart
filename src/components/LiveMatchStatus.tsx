"use client";

import { useMatchSelector, useScore } from "@/services/matchSelectors";

type Props = {
  matchId: string;
};

export default function LiveMatchStatus({ matchId }: Props) {
  const score = useScore(matchId);
  const inningsIndex = useMatchSelector(
    matchId,
    (state) => state.currentInningsIndex
  );
  const matchEnded = useMatchSelector(matchId, (state) => state.matchEnded);

  return (
    <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 px-3 py-2 text-xs">
      <span className="inline-flex items-center gap-1.5">
        {!matchEnded ? <span className="live-pulse-dot" /> : null}
        <span
          className="font-semibold uppercase tracking-[0.14em]"
          style={{ color: matchEnded ? "var(--text-muted)" : "var(--accent-live)" }}
        >
          {matchEnded ? "Completed" : "Live"}
        </span>
      </span>
      <span className="text-[var(--text-secondary)]">
        Score{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          {score.runs}/{score.wickets}
        </span>
      </span>
      <span className="text-[var(--text-secondary)]">
        Overs{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          {score.overs}
        </span>
      </span>
      <span className="text-[var(--text-secondary)]">
        Innings{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          {(inningsIndex ?? 0) + 1}
        </span>
      </span>
    </div>
  );
}
