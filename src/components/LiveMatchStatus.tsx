"use client";

import { useMatchSelector, useScore } from "@/services/matchSelectors";
import type { MatchReconnectHealth } from "@/services/match/matchRegistry";
import type { LiveSessionState } from "@/types/liveSession";

type Props = {
  matchId: string;
  sessionState?: LiveSessionState;
  reconnectHealth?: MatchReconnectHealth;
};

export function getLiveMatchStatusLabel(
  matchEnded: boolean,
  sessionState?: LiveSessionState
): string {
  if (matchEnded) return "Completed";
  if (!sessionState) return "Live";

  switch (sessionState) {
    case "INITIALIZING":
      return "Initializing";
    case "ACTIVE":
      return "Live";
    case "STALE":
      return "Stale";
    case "DISCONNECTED":
      return "Disconnected";
    case "FAILED":
      return "Failed";
    case "COMPLETED":
      return "Completed";
    default:
      return "Live";
  }
}

export default function LiveMatchStatus({
  matchId,
  sessionState,
  reconnectHealth,
}: Props) {
  const score = useScore(matchId);
  const inningsIndex = useMatchSelector(
    matchId,
    (state) => state.currentInningsIndex
  );
  const matchEnded = Boolean(
    useMatchSelector(matchId, (state) => state.matchEnded)
  );
  const label = getLiveMatchStatusLabel(matchEnded, sessionState);
  const showPulse = !matchEnded && sessionState !== "DISCONNECTED" && sessionState !== "FAILED";

  return (
    <div className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 px-3 py-2 text-xs">
      <span className="inline-flex items-center gap-1.5">
        {showPulse && <span className="live-pulse-dot" />}
        <span
          className="font-semibold uppercase tracking-[0.14em]"
          style={{
            color:
              matchEnded || sessionState === "FAILED"
                ? "var(--text-muted)"
                : sessionState === "DISCONNECTED"
                  ? "var(--accent-amber)"
                  : "var(--accent-live)",
          }}
        >
          {label}
        </span>
      </span>
      <span className="text-[var(--text-secondary)]">
        Score <span className="font-semibold text-[var(--text-primary)]">{score.runs}/{score.wickets}</span>
      </span>
      <span className="text-[var(--text-secondary)]">
        Overs <span className="font-semibold text-[var(--text-primary)]">{score.overs}</span>
      </span>
      <span className="text-[var(--text-secondary)]">
        Innings <span className="font-semibold text-[var(--text-primary)]">{(inningsIndex ?? 0) + 1}</span>
      </span>
      {sessionState ? (
        <span className="text-[var(--text-secondary)]">
          Session <span className="font-semibold text-[var(--text-primary)]">{sessionState}</span>
        </span>
      ) : null}
      {reconnectHealth ? (
        <span className="text-[var(--text-secondary)]">
          Feed <span className="font-semibold text-[var(--text-primary)]">{reconnectHealth}</span>
        </span>
      ) : null}
    </div>
  );
}
