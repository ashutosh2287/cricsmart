"use client";

import { useEffect, useMemo, useState } from "react";
import type { InningsState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";
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
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-2">
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <p className="max-w-3xl text-sm leading-6 text-white/65">{description}</p>
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
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ChartTab>("winProbability");
  const [teamFilter, setTeamFilter] = useState<TeamFilter>("both");

  const latestWinPoint = winProbabilityData.length
    ? winProbabilityData[winProbabilityData.length - 1]
    : null;
  const latestMomentum = momentumData.length
    ? momentumData[momentumData.length - 1]?.score ?? 0
    : 0;

  const progression = useMemo(() => buildProgressionData(innings), [innings]);

  const battingWin = latestWinPoint?.batting ?? 50;
  const bowlingWin = latestWinPoint?.bowling ?? 50;
  const leader =
    battingWin === bowlingWin
      ? "Match evenly balanced"
      : battingWin > bowlingWin
        ? `${currentBattingTeam} slightly ahead`
        : `${currentBowlingTeam} applying pressure`;
  const pressureSnapshot =
    latestMomentum > MOMENTUM_POSITIVE_THRESHOLD
      ? {
          momentum: "Batting control",
          momentumNote: "Pressure easing",
          pressure: "Low",
          pressureNote: "Required RR dropping",
        }
      : latestMomentum < MOMENTUM_NEGATIVE_THRESHOLD
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
      <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(56,189,248,0.1),rgba(17,24,39,0.88))] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-sky-300/80">
              KEY STATS
            </p>
            <h3 className="text-xl font-semibold text-white">Win Probability</h3>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center justify-center rounded-2xl border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-medium text-sky-200 transition hover:bg-sky-400/15"
          >
            View graph ›
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/45 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/55">
              WIN PROBABILITY
            </p>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm font-medium text-white">
              <span>
                {currentBattingTeam} {battingWin.toFixed(0)}%
              </span>
              <span>
                {currentBowlingTeam} {bowlingWin.toFixed(0)}%
              </span>
            </div>

            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="flex h-full">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-emerald-300"
                  style={{ width: `${battingWin}%` }}
                />
                <div
                  className="h-full bg-gradient-to-r from-rose-400 to-amber-300"
                  style={{ width: `${bowlingWin}%` }}
                />
              </div>
            </div>
            <p className="mt-4 text-sm text-white/70">
              {leader}. Pressure shifting ball-by-ball.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Overs
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{currentOver}</p>
              <p className="mt-1 text-sm text-white/55">Match progress</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Current rate
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{currentRunRate}</p>
              <p className="mt-1 text-sm text-white/55">Runs per over</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Momentum
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {pressureSnapshot.momentum}
              </p>
              <p className="mt-1 text-sm text-white/55">
                {pressureSnapshot.momentumNote}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/50">
                Pressure
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {pressureSnapshot.pressure}
              </p>
              <p className="mt-1 text-sm text-white/55">
                {pressureSnapshot.pressureNote}
              </p>
            </div>
          </div>
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#08111f] shadow-[0_32px_120px_rgba(2,6,23,0.55)]">
            <div className="flex flex-col gap-5 border-b border-white/10 p-5 md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-sky-300/80">
                    Match graphs
                  </p>
                  <h3 className="text-2xl font-semibold text-white">
                    Understand the match at a glance
                  </h3>
                  <p className="max-w-3xl text-sm leading-6 text-white/65">
                    Switch between win probability, over-by-over scoring, run
                    rate, worm progression, and momentum views.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-xl text-white/70 transition hover:bg-white/[0.08]"
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
                          ? "rounded-2xl bg-sky-400 px-4 py-2 text-sm font-medium text-slate-950"
                          : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
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
                          ? "rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950"
                          : "rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
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
                    data={winProbabilityData}
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
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        {showBattingSeries ? (
                          <Bar
                            dataKey="batting"
                            name={currentBattingTeam}
                            fill="#34d399"
                            radius={[8, 8, 0, 0]}
                          />
                        ) : null}
                        {showBowlingSeries ? (
                          <Bar
                            dataKey="bowling"
                            name={currentBowlingTeam}
                            fill="#f97316"
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
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        {showBattingSeries ? (
                          <Line
                            type="monotone"
                            dataKey="batting"
                            name={currentBattingTeam}
                            stroke="#38bdf8"
                            strokeWidth={3}
                            dot={false}
                          />
                        ) : null}
                        {showBowlingSeries ? (
                          <Line
                            type="monotone"
                            dataKey="bowling"
                            name={currentBowlingTeam}
                            stroke="#f59e0b"
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
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="wormBowling" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                            <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        {showBattingSeries ? (
                          <Area
                            type="monotone"
                            dataKey="batting"
                            name={currentBattingTeam}
                            stroke="#38bdf8"
                            fill="url(#wormBatting)"
                            strokeWidth={3}
                          />
                        ) : null}
                        {showBowlingSeries ? (
                          <Area
                            type="monotone"
                            dataKey="bowling"
                            name={currentBowlingTeam}
                            stroke="#f97316"
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
                      <LineChart data={momentumData}>
                        <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                        <XAxis dataKey="over" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          name="Momentum score"
                          stroke="#a78bfa"
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
                  <MomentumHeatmap data={momentumData} />
                </ChartShell>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
