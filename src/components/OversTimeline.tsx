"use client";

import { useMemo, useState } from "react";
import { useMatchSelector } from "@/services/matchSelectors";
import type { BallEvent } from "@/types/ballEvent";

type Props = {
  slug: string;
};

type InningsSlice = {
  battingTeam?: string;
  overs?: Record<number, BallEvent[]>;
};

type OverSummary = {
  overNumber: number;
  startRuns: number;
  startWickets: number;
  overRuns: number;
  balls: BallEvent[];
};

function getBallLabel(ball: BallEvent) {
  if (ball.type === "WICKET" || ball.wicket) return "W";
  if (ball.type === "WD") return "Wd";
  if (ball.type === "NB") return "Nb";
  const totalRuns = ball.totalRuns ?? ball.runs ?? 0;
  if (totalRuns === 0) return "•";
  return String(totalRuns);
}

function getBallChipClass(label: string) {
  if (label === "6") return "bg-[var(--accent)] text-white";
  if (label === "4") return "bg-[var(--brand)] text-white";
  if (label === "W") return "bg-[var(--danger)] text-white";
  if (label === "Wd" || label === "Nb") return "bg-[var(--amber)] text-white";
  if (label === "•") return "bg-[var(--surface-3)] text-[var(--text-primary)]";
  return "bg-[var(--surface-2)] text-[var(--text-primary)]";
}

export default function OversTimeline({ slug }: Props) {
  const innings = useMatchSelector<InningsSlice[] | undefined>(slug, (state) => state?.innings);
  const [selectedInnings, setSelectedInnings] = useState(0);

  const hasSecondInningsOvers = Boolean(
    innings?.[1]?.overs && Object.keys(innings[1].overs).length
  );

  const activeInnings = innings?.[selectedInnings] ?? innings?.[0];

  const overSummaries = useMemo<OverSummary[]>(() => {
    const overs = activeInnings?.overs ?? {};
    const overNumbers = Object.keys(overs)
      .map(Number)
      .filter((overNumber) => Number.isFinite(overNumber))
      .sort((a, b) => a - b);

    let cumulativeRuns = 0;
    let cumulativeWickets = 0;
    const summaries: OverSummary[] = [];

    for (const overNumber of overNumbers) {
      const balls = overs[overNumber] ?? [];
      const overRuns = balls.reduce(
        (sum, ball) => sum + (ball.totalRuns ?? ball.runs ?? 0),
        0
      );
      const wicketsInOver = balls.filter(
        (ball) => ball.type === "WICKET" || ball.wicket
      ).length;

      summaries.push({
        overNumber,
        startRuns: cumulativeRuns,
        startWickets: cumulativeWickets,
        overRuns,
        balls,
      });

      cumulativeRuns += overRuns;
      cumulativeWickets += wicketsInOver;
    }

    return summaries.sort((a, b) => b.overNumber - a.overNumber);
  }, [activeInnings?.overs]);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]">
      <div className="border-b border-[var(--border-subtle)] p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedInnings(0)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              selectedInnings === 0
                ? "border-[var(--accent-brand)] bg-[var(--accent-brand)] text-white"
                : "border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)]"
            }`}
          >
            {(innings?.[0]?.battingTeam ?? "India")} (1st Inn)
          </button>
          {hasSecondInningsOvers ? (
            <button
              type="button"
              onClick={() => setSelectedInnings(1)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                selectedInnings === 1
                  ? "border-[var(--accent-brand)] bg-[var(--accent-brand)] text-white"
                  : "border-[var(--border-subtle)] bg-transparent text-[var(--text-primary)]"
              }`}
            >
              {(innings?.[1]?.battingTeam ?? "Australia")} (2nd Inn)
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-[80px_minmax(0,1fr)_60px] border-b border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--text-muted)]">
        <span>Overs</span>
        <span>Balls</span>
        <span className="text-right">Runs</span>
      </div>

      <div className="max-h-[560px] overflow-y-auto">
        {overSummaries.length ? (
          overSummaries.map((over) => {
            const firstBall = over.balls[0];
            const bowler = firstBall?.bowler ?? "Unknown";
            const batter1 = firstBall?.batsman ?? "Unknown";
            const batter2 = firstBall?.nonStriker ?? "Unknown";

            return (
              <div
                key={over.overNumber}
                className="grid grid-cols-[80px_minmax(0,1fr)_60px] gap-3 border-b border-[var(--border-subtle)] px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    Ov {over.overNumber + 1}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {over.startRuns}-{over.startWickets}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm text-[var(--text-muted)]">
                    {bowler} to {batter1} &amp; {batter2}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {over.balls.map((ball, index) => {
                      const label = getBallLabel(ball);
                      return (
                        <span
                          key={`${over.overNumber}-${index}`}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${getBallChipClass(
                            label
                          )}`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {over.overRuns}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-3 py-4 text-sm text-[var(--text-muted)]">
            No overs recorded yet for this innings.
          </div>
        )}
      </div>
    </div>
  );
}
