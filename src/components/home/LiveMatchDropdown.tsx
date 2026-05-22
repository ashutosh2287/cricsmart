"use client";

import Link from "next/link";
import { useState } from "react";

type LiveMatch = {
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
};

type Props = { count: number; matches: LiveMatch[] };

export function LiveMatchDropdown({ count, matches }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-4 py-3 text-left transition hover:border-emerald-500/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-xl font-semibold tabular-nums ${count > 0 ? "text-emerald-400" : "text-[var(--text-primary)]"}`}>
              {count}
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">Live Matches</p>
          </div>
          {count > 0 ? (
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span>{open ? "▲" : "▼"}</span>
            </div>
          ) : null}
        </div>
      </button>

      {open && count > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 space-y-2">
          {matches.map((match) => (
            <Link
              key={match.id}
              href={`/match/${match.runtimeMatchId}`}
              className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 transition hover:border-emerald-500/30"
            >
              <div className="mb-1.5 flex items-center justify-between">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{match.title}</p>
                <span className="flex items-center gap-1 text-[11px] text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  LIVE
                </span>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                {match.teamA} vs {match.teamB}
              </p>

              {match.tossWinner ? (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {match.tossWinner} won toss · elected to {match.tossDecision === "BAT" ? "bat" : "bowl"}
                </p>
              ) : null}

              {match.battingTeam ? (
                <p className="mt-1 text-xs font-medium text-emerald-400">
                  {match.battingTeam} batting · {match.currentScore ?? "0/0"} ({match.currentOvers ?? "0.0"} ov)
                </p>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
