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
  bowler: string;
  batter1: string;
  batter2: string;
  overRuns: number;
  outcomes: string[];
};

function getOutcome(ball: BallEvent) {
  if (ball.type === "WICKET" || ball.wicket) return "W";
  if (ball.extraType === "WD") return "Wd";
  if (ball.extraType === "NB") return "Nb";
  const totalRuns = ball.totalRuns ?? ball.runs ?? 0;
  if (totalRuns === 0) return "•";
  return String(totalRuns);
}

function getChipStyle(outcome: string) {
  if (outcome === "6") {
    return { backgroundColor: "#7C4DFF", color: "#FFFFFF" };
  }
  if (outcome === "4") {
    return { backgroundColor: "#4F7CFF", color: "#FFFFFF" };
  }
  if (outcome === "W") {
    return { backgroundColor: "#FF4D5A", color: "#FFFFFF" };
  }
  if (outcome === "Wd" || outcome === "Nb") {
    return { backgroundColor: "#F59E0B", color: "#1F2937" };
  }
  if (outcome === "•") {
    return { backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" };
  }
  return { backgroundColor: "rgba(255,255,255,0.1)", color: "var(--text-primary)" };
}

function hasOverData(innings?: InningsSlice) {
  return Boolean(innings?.overs && Object.keys(innings.overs).length > 0);
}

function formatInningsLabel(teamName: string | undefined, inningsLabel: string) {
  return `${teamName ?? "Team"} (${inningsLabel})`;
}

export default function OversTimeline({ slug }: Props) {
  const innings = useMatchSelector<InningsSlice[] | undefined>(
    slug,
    (state) => state.innings
  );

  const inningsOptions = useMemo(
    () =>
      [
        {
          index: 0,
          label: formatInningsLabel(innings?.[0]?.battingTeam, "1st Inn"),
          hasOvers: hasOverData(innings?.[0]),
        },
        {
          index: 1,
          label: formatInningsLabel(innings?.[1]?.battingTeam, "2nd Inn"),
          hasOvers: hasOverData(innings?.[1]),
        },
      ].filter((option) => option.index === 0 || option.hasOvers),
    [innings]
  );

  const [selectedInnings, setSelectedInnings] = useState<number | null>(null);
  const preferredInnings = inningsOptions.find((option) => option.hasOvers)?.index ?? 0;
  const activeInnings =
    selectedInnings !== null &&
    inningsOptions.some((option) => option.index === selectedInnings)
      ? selectedInnings
      : preferredInnings;

  const selectedOvers = innings?.[activeInnings]?.overs;

  const overSummaries = useMemo(() => {
    if (!selectedOvers) return [];

    const overNumbers = Object.keys(selectedOvers)
      .map(Number)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    let cumulativeRuns = 0;
    let cumulativeWickets = 0;

    const summaries = overNumbers.map((overNumber) => {
      const balls = selectedOvers[overNumber] ?? [];
      const firstBall = balls[0];
      const overRuns = balls.reduce(
        (sum, ball) => sum + (ball.totalRuns ?? ball.runs ?? 0),
        0
      );
      const wickets = balls.filter(
        (ball) => ball.type === "WICKET" || ball.wicket
      ).length;

      const summary: OverSummary = {
        overNumber,
        startRuns: cumulativeRuns,
        startWickets: cumulativeWickets,
        bowler: firstBall?.bowler ?? "Unknown",
        batter1: firstBall?.batsman ?? "Unknown",
        batter2: firstBall?.nonStriker ?? "Unknown",
        overRuns,
        outcomes: balls.map(getOutcome),
      };

      cumulativeRuns += overRuns;
      cumulativeWickets += wickets;

      return summary;
    });

    return summaries.reverse();
  }, [selectedOvers]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {inningsOptions.map((option) => {
          const isActive = activeInnings === option.index;

          return (
            <button
              key={option.index}
              type="button"
              onClick={() => setSelectedInnings(option.index)}
              className="rounded-lg px-4 py-2 text-sm font-medium transition"
              style={{
                background: isActive ? "var(--accent-brand)" : "transparent",
                color: isActive ? "#08111f" : "var(--text-primary)",
                border: `1px solid ${isActive ? "transparent" : "var(--border-subtle)"}`,
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{
          border: "1px solid var(--border-subtle)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <div
          className="grid grid-cols-[80px_minmax(0,1fr)_60px] gap-3 px-4 py-3 text-[11px] font-medium uppercase tracking-[0.16em]"
          style={{
            color: "var(--text-muted)",
            borderBottom: "1px solid var(--border-subtle)",
          }}
        >
          <span>Overs</span>
          <span>Balls</span>
          <span className="text-right">Runs</span>
        </div>

        {overSummaries.length ? (
          <div className="max-h-[560px] overflow-y-auto">
            {overSummaries.map((over) => (
              <div
                key={over.overNumber}
                className="grid grid-cols-[80px_minmax(0,1fr)_60px] gap-3 px-4 py-4"
                style={{ borderBottom: "1px solid var(--border-subtle)" }}
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Ov {over.overNumber + 1}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {over.startRuns}-{over.startWickets}
                  </p>
                </div>

                <div className="min-w-0">
                  <p
                    className="truncate text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {over.bowler} to {over.batter1} &amp; {over.batter2}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {over.outcomes.map((outcome, index) => (
                      <span
                        key={`${over.overNumber}-${index}`}
                        className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold"
                        style={getChipStyle(outcome)}
                      >
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className="text-lg font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {over.overRuns}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-5 text-sm" style={{ color: "var(--text-muted)" }}>
            No overs recorded yet for this innings.
          </div>
        )}
      </div>
    </div>
  );
}
