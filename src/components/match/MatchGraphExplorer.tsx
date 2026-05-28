"use client";

import { useEffect, useMemo, useState } from "react";
import type { InningsState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";
import type { MatchMetadata } from "@/types/matchMetadata";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import WinProbabilityChart from "@/components/analytics/WinProbabilityChart";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type WinProbabilityPoint = {
  over: number;
  batting: number;
  bowling: number;
  confidence?: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
};

type MomentumPoint = {
  over: number;
  score: number;
};

type Props = {
  currentBowlingTeam: string;
  currentBattingTeam: string;
  currentOver: string;
  currentRunRate: string;
  innings: InningsState[];
  momentumData: MomentumPoint[];
  winProbabilityData: WinProbabilityPoint[];
  metadata?: MatchMetadata;
};

type ChartTab =
  | "winProbability"
  | "overs"
  | "runRate"
  | "worm"
  | "momentum"
  | "momentumMap";

type TeamFilter = "both" | "batting" | "bowling";

const MOMENTUM_POSITIVE_THRESHOLD = 1.5;
const MOMENTUM_NEGATIVE_THRESHOLD = -1.5;

type ProgressionPoint = {
  label: string;
  batting: number | null;
  bowling: number | null;
};

function getBallTotalRuns(ball: BallEvent) {
  return ball.totalRuns ?? ball.runs ?? 0;
}

function buildProgressionData(innings: InningsState[]) {
  const overs: ProgressionPoint[] = [];
  const runRate: ProgressionPoint[] = [];
  const worm: ProgressionPoint[] = [];

  innings.forEach((inningsState, inningsIndex) => {
    const overKeys = Object.keys(inningsState.overs ?? {})
      .map(Number)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    let cumulativeRuns = 0;
    let legalBalls = 0;

    overKeys.forEach((overNumber) => {
      const deliveries = inningsState.overs[overNumber] ?? [];
      const overRuns = deliveries.reduce(
        (sum, delivery) => sum + getBallTotalRuns(delivery),
        0
      );

      cumulativeRuns += overRuns;
      legalBalls += deliveries.filter((delivery) => delivery.isLegalDelivery).length;

      const rate = legalBalls > 0 ? Number(((cumulativeRuns / legalBalls) * 6).toFixed(2)) : 0;
      const label = `I${inningsIndex + 1}.${overNumber + 1}`;
      const isBattingSeries = inningsIndex === 0;

      overs.push({
        label,
        batting: isBattingSeries ? overRuns : null,
        bowling: isBattingSeries ? null : overRuns,
      });
      runRate.push({
        label,
        batting: isBattingSeries ? rate : null,
        bowling: isBattingSeries ? null : rate,
      });
      worm.push({
        label,
        batting: isBattingSeries ? cumulativeRuns : null,
        bowling: isBattingSeries ? null : cumulativeRuns,
      });
    });
  });

  return { overs, runRate, worm };
}

function ChartShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/70 p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-2">
        <h4 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h4>
        <p className="max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
      </div>
      {children}
    </div>
  );
}

export default function MatchGraphExplorer({
  currentBowlingTeam,
  currentBattingTeam,
  currentOver,
  currentRunRate,
  innings,
  momentumData,
  winProbabilityData,
  metadata,
}: Props) {
  const safeInnings = useMemo(() => (Array.isArray(innings) ? innings : []), [innings]);
  const safeMomentumData = useMemo(
    () => (Array.isArray(momentumData) ? momentumData : []),
    [momentumData]
  );
  const safeWinProbabilityData = useMemo(
    () => (Array.isArray(winProbabilityData) ? winProbabilityData : []),
    [winProbabilityData]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChartTab>("winProbability");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("both");
  const effectiveWinProbabilityData = safeWinProbabilityData;

  const latestWinPoint = effectiveWinProbabilityData.length
    ? effectiveWinProbabilityData[effectiveWinProbabilityData.length - 1]
    : null;
  const latestMomentum = safeMomentumData.length
    ? safeMomentumData[safeMomentumData.length - 1]?.score ?? 0
    : 0;

  const progression = useMemo(() => buildProgressionData(safeInnings), [safeInnings]);

  const battingWin = latestWinPoint?.batting ?? 0;
  const bowlingWin = latestWinPoint?.bowling ?? 0;
  const confidence = latestWinPoint?.confidence;
  const battingTeamLabel = metadata?.teamA?.name ?? currentBattingTeam;
  const bowlingTeamLabel = metadata?.teamB?.name ?? currentBowlingTeam;
  const leader =
      !latestWinPoint
        ? "Awaiting replay events"
      : battingWin === bowlingWin
      ? "Match evenly balanced"
      : battingWin > bowlingWin
        ? `${battingTeamLabel} slightly ahead`
        : `${bowlingTeamLabel} applying pressure`;
  const pressureSnapshot =
    latestMomentum >= MOMENTUM_POSITIVE_THRESHOLD
      ? {
          momentum: "Batting control",
          momentumNote: "Pressure easing",
          pressure: "Low",
          pressureNote: "Required RR dropping",
        }
      : latestMomentum <= MOMENTUM_NEGATIVE_THRESHOLD
        ? {
            momentum: "Bowling control",
            momentumNote: "Pressure building",
            pressure: "High",
            pressureNote: "Required RR climbing",
          }
        : {
            momentum: "Balanced",
            momentumNote: "Pressure shifting",
            pressure: "Medium",
            pressureNote: "Required RR stable",
          };

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const showBattingSeries = teamFilter === "both" || teamFilter === "batting";
  const showBowlingSeries = teamFilter === "both" || teamFilter === "bowling";

  return (
    <>
      <div
        className="rounded-[30px] border border-[var(--border-subtle)] bg-[var(--gradient-surface)] p-6"
        style={{
          boxShadow: "0 24px 80px color-mix(in srgb, var(--bg-base) 38%, transparent)",
        }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent-brand)]">
              KEY STATS
            </p>
            <h3 className="text-xl font-semibold text-[var(--text-primary)]">Win Probability</h3>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-raised)]/70 px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-raised)]"
          >
            View Graphs ›
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--text-secondary)]">
              WIN PROBABILITY
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm font-medium text-[var(--text-primary)]">
              <span aria-label={`${battingTeamLabel} win probability ${battingWin.toFixed(0)} percent`}>
                <span>{battingTeamLabel}</span>{" "}
                <span className="tabular-nums">{battingWin.toFixed(0)}%</span>
              </span>
              <span aria-label={`${bowlingTeamLabel} win probability ${bowlingWin.toFixed(0)} percent`}>
                <span>{bowlingTeamLabel}</span>{" "}
                <span className="tabular-nums">{bowlingWin.toFixed(0)}%</span>
              </span>
            </div>

            {confidence !== undefined ? (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Model confidence {(confidence * 100).toFixed(0)}%
              </p>
            ) : null}

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--overlay-soft)]">
              <div className="flex h-full">
                <div
                  className="h-full"
                  style={{
                    background:
                      "linear-gradient(to right, var(--chart-positive), color-mix(in srgb, var(--chart-positive) 65%, var(--text-inv)))",
                    width: `${battingWin}%`,
                  }}
                />
                <div
                  className="h-full"
                  style={{
                    background:
                      "linear-gradient(to right, var(--chart-negative), var(--chart-neutral))",
                    width: `${bowlingWin}%`,
                  }}
                />
              </div>
            </div>
            {!latestWinPoint ? (
              <p className="mt-3 text-xs text-[var(--text-secondary)]">
                No replay events yet.
              </p>
            ) : null}
            <p className="mt-4 text-sm text-[var(--text-secondary)]">
              {leader}. Pressure shifting ball-by-ball.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-raised)]/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Overs
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{currentOver}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Match progress</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-raised)]/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Current rate
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{currentRunRate}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Runs per over</p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-raised)]/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Momentum
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {pressureSnapshot.momentum}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {pressureSnapshot.momentumNote}
              </p>
            </div>
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--bg-raised)]/60 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                Pressure
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                {pressureSnapshot.pressure}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {pressureSnapshot.pressureNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="theme-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-[var(--bg-overlay)]"
            style={{
              boxShadow: "0 32px 120px color-mix(in srgb, var(--bg-base) 55%, transparent)",
            }}
          >
            <div className="flex flex-col gap-5 border-b border-[var(--border-subtle)] p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--accent-brand)]">
                    Match graphs
                  </p>
                  <h3 className="text-2xl font-semibold text-[var(--text-primary)]">
                    Understand the match at a glance
                  </h3>
                  <p className="max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                    Switch between win probability, over-by-over scoring, run
                    rate, worm progression, and momentum views.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-raised)]/65 text-xl text-[var(--text-secondary)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                  aria-label="Close graphs"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-2">
                  {[
                    ["winProbability", "Win Probability"],
                    ["overs", "Overs"],
                    ["runRate", "Run Rate"],
                    ["worm", "Worm"],
                    ["momentum", "Momentum"],
                    ["momentumMap", "Momentum Map"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTab(key as ChartTab)}
                      className={
                        activeTab === key
                          ? "rounded-2xl bg-[var(--accent-brand)] px-4 py-2 text-sm font-medium text-[var(--bg-base)]"
                          : "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-raised)]/65 px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["both", "Both"],
                    ["batting", currentBattingTeam],
                    ["bowling", currentBowlingTeam],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTeamFilter(key as TeamFilter)}
                      className={
                        teamFilter === key
                          ? "rounded-2xl bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)]"
                          : "rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-raised)]/65 px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]"
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-y-auto p-5 md:p-6">
              {activeTab === "winProbability" ? (
                <ChartShell
                  title="Win probability"
                  description="Tracks the likely winner over time. The green line represents the current batting side and the red line represents the bowling side."
                >
                  <WinProbabilityChart
                    data={effectiveWinProbabilityData}
                    team1={currentBattingTeam}
                    team2={currentBowlingTeam}
                  />
                </ChartShell>
              ) : null}

              {activeTab === "overs" ? (
                <ChartShell
                  title="Overs"
                  description="Shows how many runs each side scored in every over, so you can spot quiet phases and big scoring bursts quickly."
                >
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={progression.overs}>
                        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="var(--chart-axis)" />
                        <YAxis stroke="var(--chart-axis)" />
                        <Tooltip />
                        {showBattingSeries ? (
                          <Bar
                            dataKey="batting"
                            name={currentBattingTeam}
                            fill="var(--chart-positive)"
                            radius={[8, 8, 0, 0]}
                          />
                        ) : null}
                        {showBowlingSeries ? (
                          <Bar
                            dataKey="bowling"
                            name={currentBowlingTeam}
                            fill="var(--chart-bowling)"
                            radius={[8, 8, 0, 0]}
                          />
                        ) : null}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartShell>
              ) : null}

              {activeTab === "runRate" ? (
                <ChartShell
                  title="Run rate"
                  description="Tracks how fast each innings is scoring at the end of every over, making pressure shifts much easier to read."
                >
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progression.runRate}>
                        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="var(--chart-axis)" />
                        <YAxis stroke="var(--chart-axis)" />
                        <Tooltip />
                        {showBattingSeries ? (
                          <Line
                            type="monotone"
                            dataKey="batting"
                            name={currentBattingTeam}
                            stroke="var(--chart-batting)"
                            strokeWidth={3}
                            dot={false}
                          />
                        ) : null}
                        {showBowlingSeries ? (
                          <Line
                            type="monotone"
                            dataKey="bowling"
                            name={currentBowlingTeam}
                            stroke="var(--chart-neutral)"
                            strokeWidth={3}
                            dot={false}
                          />
                        ) : null}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartShell>
              ) : null}

              {activeTab === "worm" ? (
                <ChartShell
                  title="Worm"
                  description="Compares the innings totals over time. This is the quickest way to see which side built the stronger score over each stretch."
                >
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={progression.worm}>
                        <defs>
                          <linearGradient id="wormBatting" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-batting)" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="var(--chart-batting)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="wormBowling" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-bowling)" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="var(--chart-bowling)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="var(--chart-axis)" />
                        <YAxis stroke="var(--chart-axis)" />
                        <Tooltip />
                        {showBattingSeries ? (
                          <Area
                            type="monotone"
                            dataKey="batting"
                            name={currentBattingTeam}
                            stroke="var(--chart-batting)"
                            fill="url(#wormBatting)"
                            strokeWidth={3}
                          />
                        ) : null}
                        {showBowlingSeries ? (
                          <Area
                            type="monotone"
                            dataKey="bowling"
                            name={currentBowlingTeam}
                            stroke="var(--chart-bowling)"
                            fill="url(#wormBowling)"
                            strokeWidth={3}
                          />
                        ) : null}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </ChartShell>
              ) : null}

              {activeTab === "momentum" ? (
                <ChartShell
                  title="Momentum"
                  description="Positive values mean the batting side is building control. Negative values show the bowling side has swung the pressure back."
                >
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={safeMomentumData}>
                        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
                        <XAxis dataKey="over" stroke="var(--chart-axis)" />
                        <YAxis stroke="var(--chart-axis)" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Momentum score"
                          stroke="var(--brand)"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartShell>
              ) : null}

              {activeTab === "momentumMap" ? (
                <ChartShell
                  title="Momentum map"
                  description="A heat-strip view of pressure across the innings. Green blocks favour the batting side, red blocks favour the bowling side, and yellow means the game is stable."
                >
                  <MomentumHeatmap data={safeMomentumData} />
                </ChartShell>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
