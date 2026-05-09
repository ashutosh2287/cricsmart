"use client";

import React, { useEffect, useMemo, useState, use, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminScoringPanel from "@/components/admin/AdminScoringPanel";
import BroadcastControlDashboard from "@/components/BroadcastControlDashboard";
import BroadcastDirectorPanel from "@/components/BroadcastDirectorPanel";
import CommentaryPanel from "@/components/match/CommentaryPanel";
import GlassPanel from "@/components/ui/GlassPanel";
import HighlightTimeline from "@/components/HighlightTimeline";
import LiveMatchStatus from "@/components/LiveMatchStatus";
import MatchControlPanel from "@/components/MatchControlPanel";
import MatchHeader from "@/components/MatchHeader";
import MatchInsightsPanel from "@/components/analytics/MatchInsightsPanel";
import MatchNarrativePanel from "@/components/analytics/MatchNarrativePanel";
import MatchStory from "@/components/MatchStory";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import OversTimeline from "@/components/OversTimeline";
import PageMotion from "@/components/ui/PageMotion";
import PartnershipPanel from "@/components/PartnershipPanel";
import ReplaySlider from "@/components/match/ReplaySlider";
import TeamSelector from "@/components/teams/TeamSelector";
import TossPanel from "@/components/match/TossPanel";
import WinProbabilityChart from "@/components/analytics/WinProbabilityChart";
import { getMatchMeta, subscribeStore } from "@/store/matchStore";
import { MatchProvider, useMatch } from "@/context/MatchContext";
import { Team } from "@/data/teams";
import { Match } from "@/types/match";
import { motion } from "framer-motion";

// ✅ Only keep what's needed from matchEngine
import {
  hydrateMatchState,
} from "@/services/matchEngine";

// ✅ Import setMatchState so hydration feeds into eventStore (MatchProvider's source)
import { setMatchState } from "@/lib/eventStore";

import { enableBroadcast, disableBroadcast } from "@/services/broadcastMode";
import { initCommentaryVoice } from "@/services/commentary/commentaryVoiceEngine";
import {
  getBattingStats,
  getBowlingStats,
  getExtras,
  getFallOfWickets,
} from "@/services/analytics/scorecardEngine";
import {
  connectRealtime,
  getRealtimeConnectionState,
} from "@/services/realtime/connectRealtime";
import { initTacticalOverlayBridge } from "@/services/tacticalOverlayBridge";
import WagonWheel from "@/components/analytics/WagonWheel";
import { setMatchMeta } from "@/store/matchStore";
import AnimatedScore from "@/components/ui/AnimatedScore";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type AnalysisFilter = "ALL" | "BATTING" | "BOWLING" | "PRESSURE";
type MainTab =
  | "overview"
  | "live"
  | "analysis"
  | "timeline"
  | "scorecard"
  | "admin";

type BowlerStat = {
  overs?: number;
  runs?: number;
  wickets?: number;
};

type BroadcastInsight = {
  type:
    | "KEY_MOMENT"
    | "PARTNERSHIP_ALERT"
    | "MOMENTUM_SHIFT"
    | "PHASE_UPDATE"
    | "COLLAPSE_ALERT";
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatOverDisplay(overs?: Record<string, unknown>) {
  if (!overs) return 0;

  const keys = Object.keys(overs)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  if (!keys.length) return 0;

  const lastOverNumber = keys[keys.length - 1];
  const balls = Array.isArray(overs[lastOverNumber])
    ? (overs[lastOverNumber] as unknown[]).length
    : 0;

  if (balls >= 6) return lastOverNumber + 1;
  return Number(`${lastOverNumber}.${balls}`);
}

// ─────────────────────────────────────────────
// UI atoms
// ─────────────────────────────────────────────

function StatPill({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  const toneMap = {
    neutral: "border-white/10 bg-white/[0.03] text-white",
    green: "border-white/10 bg-white/[0.03] text-white",
    blue: "border-white/10 bg-white/[0.03] text-white",
    amber: "border-white/10 bg-white/[0.03] text-white",
    red: "border-white/10 bg-white/[0.03] text-white",
  };

  return (
    <div className={cls("rounded-2xl border px-4 py-3", toneMap[tone])}>
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
        {label}
      </p>
      <div className="mt-1 text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-sky-300/80">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

// ─────────────────────────────────────────────
// StickyInsightsRail — uses useMatch() ✅
// ─────────────────────────────────────────────

function StickyInsightsRail({ match }: { match: Match }) {
  const { state } = useMatch();

  const currentInnings = state?.innings?.[state.currentInningsIndex];

  const displayOver = currentInnings
    ? `${currentInnings.over}.${currentInnings.ball}`
    : "0.0";

  const overKeys = currentInnings?.overs
    ? Object.keys(currentInnings.overs)
        .map(Number)
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
    : [];

  const lastOverKey = overKeys.length ? overKeys[overKeys.length - 1] : undefined;

  const lastOverBalls =
    lastOverKey !== undefined &&
    Array.isArray(currentInnings?.overs?.[lastOverKey])
      ? currentInnings.overs[lastOverKey].slice(0, 6)
      : [];

  return (
    <div className="space-y-4 lg:sticky lg:top-28">
      <GlassPanel>
        <SectionHeader eyebrow="Live pulse" title="Match Snapshot" />
        <div className="grid grid-cols-1 gap-3">
          <StatPill
            label="Current innings"
            value={`Innings ${(state?.currentInningsIndex ?? 0) + 1}`}
            tone="blue"
          />
          <StatPill
            label="Batting team"
            value={currentInnings?.battingTeam ?? "TBD"}
            tone="green"
          />
          <StatPill
            label="Bowling team"
            value={currentInnings?.bowlingTeam ?? "TBD"}
            tone="amber"
          />
          <StatPill
            label="Score"
            value={
              <AnimatedScore
                value={`${currentInnings?.runs ?? 0}/${currentInnings?.wickets ?? 0}`}
              />
            }
            tone="neutral"
          />
          <StatPill label="Over" value={displayOver} tone="neutral" />
          <StatPill
            label="Striker"
            value={currentInnings?.striker ?? "—"}
            tone="green"
          />
          <StatPill
            label="Non-striker"
            value={currentInnings?.nonStriker ?? "—"}
            tone="blue"
          />
          <StatPill label="Bowler" value={"—"} tone="amber" />
        </div>
      </GlassPanel>

      <GlassPanel>
        <SectionHeader eyebrow="Recent action" title="Current Over" />
        <div className="flex flex-wrap gap-2">
          {lastOverBalls.length ? (
            lastOverBalls.map(
              (
                ball: {
                  runs?: number;
                  label?: string;
                  outcome?: string;
                },
                index: number
              ) => (
                <div
                  key={index}
                  className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white"
                >
                  {ball?.runs ?? ball?.label ?? ball?.outcome ?? "•"}
                </div>
              )
            )
          ) : (
            <p className="text-sm text-white/60">No ball events yet.</p>
          )}
        </div>
      </GlassPanel>

      <GlassPanel>
        <SectionHeader eyebrow="Quick access" title="Control Deck" />
        <div className="space-y-3">
          <LiveMatchStatus />
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-medium text-white">Fixture</p>
            <p className="mt-1 text-sm text-white/70">
              {match.team1}{" "}
              <span className="text-white/40">vs</span> {match.team2}
            </p>
            <div className="mt-1 text-sm text-gray-400">
              Over: {match.currentOver ?? 0}.{match.currentBall ?? 0}
            </div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// TabsArea — uses useMatch() ✅
// ─────────────────────────────────────────────

function TabsArea({
  match,
  analytics,
  insights,
}: {
  match: Match;
  analytics: {
    winProbability: { over: number; value: number }[];
    momentum: { over: number; score: number }[];
  };
  insights: BroadcastInsight[];
}) {
  const isAdmin = true;
  const { state: currentEngineState } = useMatch();
  const [, forceMatchStoreUpdate] = useState(0);
  const [matchMeta, setLocalMatchMeta] = useState(() =>
    getMatchMeta(match.slug)
  );
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<MainTab>("overview");

  useEffect(() => {
    const tab = searchParams.get("tab") as MainTab;
    if (!tab) return;
    setTimeout(() => setActiveTab(tab), 0);
  }, [searchParams]);

  const [analysisFilter, setAnalysisFilter] = useState<AnalysisFilter>("ALL");
  const [tossData, setTossData] = useState<{
    winner: Team;
    decision: "BAT" | "BOWL";
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isStarting = false;
  const [startError, setStartError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1500);
  const [runtimeMonitor, setRuntimeMonitor] = useState(() =>
    getRealtimeConnectionState()
  );

  const hasLiveMatchState =
    !!currentEngineState &&
    !!currentEngineState.innings?.length &&
    !currentEngineState.matchEnded &&
    ((currentEngineState.innings[0]?.runs ?? 0) > 0 ||
      (currentEngineState.innings[0]?.wickets ?? 0) > 0 ||
      Object.keys(currentEngineState.innings[0]?.overs ?? {}).length > 0 ||
      currentEngineState.currentInningsIndex > 0);

  const effectiveIsRunning = isStarting || isRunning || hasLiveMatchState;
  const [selectedInnings, setSelectedInnings] = useState<number | null>(null);

  useEffect(() => {
    if (!hasLiveMatchState) return;
    setTimeout(() => {
      setIsRunning(true);
      setStartError(null);
    }, 0);
  }, [hasLiveMatchState]);

  useEffect(() => {
    const unsubscribe = subscribeStore(() => {
      forceMatchStoreUpdate((prev) => prev + 1);
      setTimeout(() => setLocalMatchMeta(getMatchMeta(match.slug)), 0);
    });
    setTimeout(() => setLocalMatchMeta(getMatchMeta(match.slug)), 0);
    return unsubscribe;
  }, [match.slug]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRuntimeMonitor(getRealtimeConnectionState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!match) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
        <div className="h-[200px] animate-pulse rounded bg-white/10" />
        <div className="h-[150px] animate-pulse rounded bg-white/10" />
      </div>
    );
  }

  const inningsIndex =
    selectedInnings !== null
      ? selectedInnings
      : currentEngineState?.currentInningsIndex ?? 0;

  const inningsData = currentEngineState?.innings?.[inningsIndex];
  const displayOver = inningsData
    ? `${inningsData.over}.${inningsData.ball}`
    : "0.0";

  const bowling = getBowlingStats(match.slug, inningsIndex) as Record<
    string,
    BowlerStat
  >;
  const extras = getExtras(match.slug, inningsIndex);
  const wickets = (getFallOfWickets(match.slug, inningsIndex) ?? []).filter(
    Boolean
  );

  const battingRecords = Array.isArray(inningsData?.battingRecords)
    ? inningsData.battingRecords
    : [];

  type PlayerRow = {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    out: boolean;
    isStriker: boolean;
    isNonStriker: boolean;
  };

  const strikerName =
    typeof inningsData?.striker === "string"
      ? inningsData.striker.trim()
      : "";
  const nonStrikerName =
    typeof inningsData?.nonStriker === "string"
      ? inningsData.nonStriker.trim()
      : "";

  const playerMap = new Map<string, PlayerRow>();

  const ensurePlayerRow = (name: string): PlayerRow => {
    const trimmedName = name.trim();
    const existing = playerMap.get(trimmedName);
    if (existing) return existing;

    const newRow: PlayerRow = {
      name: trimmedName,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
      isStriker: false,
      isNonStriker: false,
    };
    playerMap.set(trimmedName, newRow);
    return newRow;
  };

  for (const record of battingRecords) {
    if (typeof record?.name !== "string") continue;
    const name = record.name.trim();
    if (!name) continue;
    const row = ensurePlayerRow(name);
    row.runs = Number(record.runs ?? row.runs ?? 0);
    row.balls = Number(record.balls ?? row.balls ?? 0);
    row.fours = Number(record.fours ?? row.fours ?? 0);
    row.sixes = Number(record.sixes ?? row.sixes ?? 0);
    row.out = Boolean(record.isOut ?? row.out);
  }

  if (strikerName) ensurePlayerRow(strikerName).isStriker = true;
  if (nonStrikerName) ensurePlayerRow(nonStrikerName).isNonStriker = true;

  const allPlayers: PlayerRow[] = Array.from(playerMap.values());
  const activePlayers = allPlayers.filter(
    (p) => p.isStriker || p.isNonStriker
  );
  const inactivePlayers = allPlayers.filter(
    (p) => !p.isStriker && !p.isNonStriker
  );
  const players: PlayerRow[] =
    activePlayers.length > 0
      ? [...activePlayers, ...inactivePlayers]
      : allPlayers;

  const topPlayers = [...allPlayers]
    .sort((a, b) => {
      if (b.runs !== a.runs) return b.runs - a.runs;
      if (a.out !== b.out) return Number(a.out) - Number(b.out);
      return a.name.localeCompare(b.name);
    })
    .slice(0, 2);

  const partnerships =
    strikerName && nonStrikerName
      ? [{ players: `${strikerName} & ${nonStrikerName}`, runs: 0 }]
      : [];

  const mappedWinProbability = analytics.winProbability.map((p) => ({
    over: p.over,
    batting: p.value,
    bowling: 100 - p.value,
  }));

  const tabs: MainTab[] = [
    "overview",
    "live",
    "analysis",
    "timeline",
    "scorecard",
    "admin",
  ];

  const summaryCards = [
    {
      label: "Batting",
      value: inningsData?.battingTeam ?? "TBD",
      tone: "green" as const,
    },
    {
      label: "Bowling",
      value: inningsData?.bowlingTeam ?? "TBD",
      tone: "blue" as const,
    },
    {
      label: "Score",
      value: `${inningsData?.runs ?? 0}/${inningsData?.wickets ?? 0}`,
      tone: "neutral" as const,
    },
    { label: "Over", value: displayOver, tone: "amber" as const },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {/* ── Tab Bar ── */}
        <div className="sticky top-24 z-20 mb-6 overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cls(
                    "rounded-xl px-4 py-2.5 text-sm font-medium capitalize whitespace-nowrap transition-all",
                    isActive
                      ? "bg-white text-slate-950 shadow-md"
                      : "text-gray-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader
                eyebrow="Match center"
                title="Overview"
                action={<LiveMatchStatus />}
              />
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {summaryCards.map((item) => (
                  <StatPill
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    tone={item.tone}
                  />
                ))}
              </div>
            </GlassPanel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader eyebrow="Control" title="Match Controls" />
                  <MatchControlPanel matchId={match.slug} />
                </GlassPanel>

                <GlassPanel>
                  <SectionHeader eyebrow="Narrative" title="Match Story" />
                  <MatchStory matchId={match.slug} />
                </GlassPanel>

                <GlassPanel>
                  <SectionHeader eyebrow="Prediction" title="Win Probability" />
                   <WinProbabilityChart
                      data={mappedWinProbability}
                    />
                </GlassPanel>

                <div className="grid gap-6 lg:grid-cols-2">
                  <GlassPanel>
                    <SectionHeader eyebrow="Flow" title="Momentum" />
                    <MomentumHeatmap data={analytics.momentum} />
                  </GlassPanel>
                  <GlassPanel>
                    <SectionHeader eyebrow="Intelligence" title="Insights" />
                    <MatchInsightsPanel matchId={match.slug} />
                  </GlassPanel>
                </div>

                <GlassPanel>
                  <SectionHeader eyebrow="Storyline" title="Narrative Arc" />
                  <MatchNarrativePanel matchId={match.slug} />
                </GlassPanel>
              </div>

              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader eyebrow="Stand" title="Partnership Watch" />
                  <PartnershipPanel matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader eyebrow="Moments" title="Highlights" />
                  <HighlightTimeline matchId={match.slug} />
                </GlassPanel>
              </div>
            </div>
          </div>
        )}

        {/* ── Live ── */}
        {activeTab === "live" && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader eyebrow="Ball by ball" title="Live Commentary" />
              <CommentaryPanel matchId={match.slug} insights={insights} />
            </GlassPanel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
              <GlassPanel>
                <SectionHeader eyebrow="Replay" title="Replay Timeline" />
                <ReplaySlider matchId={match.slug} />
              </GlassPanel>

              <GlassPanel>
                <SectionHeader eyebrow="Live score" title="Quick Match View" />
                <div className="grid gap-3">
                  <StatPill
                    label={
                      currentEngineState?.teamA?.name ?? match.team1
                    }
                    value={`${currentEngineState?.innings?.[0]?.runs ?? 0}/${currentEngineState?.innings?.[0]?.wickets ?? 0}`}
                    tone="green"
                  />
                  <StatPill
                    label={
                      currentEngineState?.teamB?.name ?? match.team2
                    }
                    value={
                      currentEngineState?.innings?.[1]
                        ? `${currentEngineState.innings[1].runs}/${currentEngineState.innings[1].wickets}`
                        : "Yet to bat"
                    }
                    tone="blue"
                  />
                  <StatPill
                    label="Current striker"
                    value={inningsData?.striker ?? "—"}
                    tone="amber"
                  />
                  <StatPill label="Current bowler" value={"—"} tone="red" />
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {/* ── Analysis ── */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader eyebrow="Filters" title="Analysis View" />
              <div className="flex flex-wrap gap-3">
                {[
                  {
                    key: "ALL",
                    label: "All",
                    active: "bg-sky-500 text-slate-950",
                  },
                  {
                    key: "BATTING",
                    label: "Batting",
                    active: "bg-emerald-500 text-slate-950",
                  },
                  {
                    key: "BOWLING",
                    label: "Bowling",
                    active: "bg-rose-500 text-white",
                  },
                  {
                    key: "PRESSURE",
                    label: "Pressure",
                    active: "bg-amber-500 text-slate-950",
                  },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() =>
                      setAnalysisFilter(f.key as AnalysisFilter)
                    }
                    className={cls(
                      "rounded-xl border px-4 py-2 text-sm transition",
                      analysisFilter === f.key
                        ? f.active
                        : "border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] hover:text-white"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel>
              <SectionHeader eyebrow="Shot Analysis" title="Wagon Wheel" />
              <div className="flex h-[300px] items-center justify-center text-white/60">
                <WagonWheel matchId={match.slug} />
              </div>
            </GlassPanel>

            {analysisFilter === "ALL" && (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
                <div className="space-y-6">
                  <GlassPanel>
                    <SectionHeader eyebrow="Model" title="Win Probability" />
                    <WinProbabilityChart
                      data={mappedWinProbability}
                    />
                  </GlassPanel>
                  <GlassPanel>
                    <SectionHeader
                      eyebrow="Energy"
                      title="Momentum Heatmap"
                    />
                    <MomentumHeatmap data={analytics.momentum} />
                  </GlassPanel>
                </div>
                <div className="space-y-6">
                  <GlassPanel>
                    <SectionHeader eyebrow="Signals" title="Match Insights" />
                    <MatchInsightsPanel matchId={match.slug} />
                  </GlassPanel>
                  <GlassPanel>
                    <SectionHeader eyebrow="Narrative" title="Storyline" />
                    <MatchNarrativePanel matchId={match.slug} />
                  </GlassPanel>
                  <GlassPanel>
                    <SectionHeader eyebrow="Stand" title="Partnerships" />
                    <PartnershipPanel matchId={match.slug} />
                  </GlassPanel>
                </div>
              </div>
            )}

            {analysisFilter === "BATTING" && (
              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Batting"
                    title="Run Pressure & Projection"
                  />
                  <WinProbabilityChart
                    data={mappedWinProbability}
                  />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Pairs"
                    title="Partnership Strength"
                  />
                  <PartnershipPanel matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader eyebrow="Narrative" title="Batting Story" />
                  <MatchNarrativePanel matchId={match.slug} />
                </GlassPanel>
              </div>
            )}

            {analysisFilter === "BOWLING" && (
              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Bowling"
                    title="Momentum Swing"
                  />
                  <MomentumHeatmap data={analytics.momentum} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Insights"
                    title="Pressure Signals"
                  />
                  <MatchInsightsPanel matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Moments"
                    title="Bowling Highlights"
                  />
                  <HighlightTimeline matchId={match.slug} />
                </GlassPanel>
              </div>
            )}

            {analysisFilter === "PRESSURE" && (
              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Pressure"
                    title="Win Pressure Curve"
                  />
                  <WinProbabilityChart
                    data={mappedWinProbability}
                  />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Pressure"
                    title="Momentum Zones"
                  />
                  <MomentumHeatmap data={analytics.momentum} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Pressure"
                    title="Decision Insights"
                  />
                  <MatchInsightsPanel matchId={match.slug} />
                </GlassPanel>
              </div>
            )}
          </div>
        )}

        {/* ── Timeline ── */}
        {activeTab === "timeline" && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader eyebrow="Moments" title="Highlight Timeline" />
              <HighlightTimeline matchId={match.slug} />
            </GlassPanel>
            <GlassPanel>
              <SectionHeader eyebrow="Over view" title="Overs Timeline" />
              <OversTimeline slug={match.slug} />
            </GlassPanel>
          </div>
        )}

        {/* ── Scorecard ── */}
        {activeTab === "scorecard" && (
          <div className="space-y-6">
            {currentEngineState?.matchEnded && currentEngineState?.winner ? (
              <div className="mt-3 border-t border-white/10 pt-3 text-center text-sm text-white">
                {currentEngineState.winner} won{" "}
                {typeof currentEngineState.winBy === "string"
                  ? `by ${currentEngineState.winBy}`
                  : typeof currentEngineState.winBy === "number"
                  ? `by ${currentEngineState.winBy}`
                  : ""}
              </div>
            ) : null}

            <GlassPanel>
              <SectionHeader eyebrow="Innings" title="Scorecard" />
              <div className="mb-5 flex flex-wrap gap-2">
                {(currentEngineState?.innings || []).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedInnings(i)}
                    className={cls(
                      "rounded-xl px-4 py-2 text-sm transition",
                      inningsIndex === i
                        ? "bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-950 shadow-lg"
                        : "border border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"
                    )}
                  >
                    Innings {i + 1}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <StatPill
                  label="Batting team"
                  value={inningsData?.battingTeam ?? "Unknown"}
                  tone="green"
                />
                <StatPill
                  label="Bowling team"
                  value={inningsData?.bowlingTeam ?? "Unknown"}
                  tone="blue"
                />
                <StatPill
                  label="Score"
                  value={
                    <AnimatedScore
                      value={`${inningsData?.runs ?? 0}/${inningsData?.wickets ?? 0}`}
                    />
                  }
                  tone="neutral"
                />
                <StatPill label="Over" value={displayOver} tone="amber" />
              </div>
            </GlassPanel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="space-y-6">
                {/* Batting card */}
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Batting card"
                    title="Batters"
                    action={
                      <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                        {activePlayers.length === 2
                          ? `${activePlayers.length} active • ${allPlayers.length} total`
                          : `${allPlayers.length} total records`}
                      </span>
                    }
                  />
                  <div className="grid grid-cols-[minmax(160px,1.6fr)_0.7fr_0.7fr_0.7fr_0.8fr] gap-3 border-b border-white/10 px-3 pb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <span>Batter</span>
                    <span className="text-center">R</span>
                    <span className="text-center">B</span>
                    <span className="text-center">4s/6s</span>
                    <span className="text-center">SR</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {players.length ? (
                      players.map((player) => {
                        const sr =
                          player.balls > 0
                            ? ((player.runs / player.balls) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={player.name}
                            className={cls(
                              "grid grid-cols-[minmax(160px,1.6fr)_0.7fr_0.7fr_0.7fr_0.8fr] items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
                              player.isStriker
                                ? "border-amber-400/20 bg-amber-400/10"
                                : player.isNonStriker
                                ? "border-sky-400/15 bg-sky-400/10"
                                : "border-white/10 bg-white/[0.04]"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {player.isStriker && (
                                  <span className="text-amber-300">★</span>
                                )}
                                {player.isNonStriker && (
                                  <span className="text-sky-300">○</span>
                                )}
                                <span className="truncate font-medium text-white">
                                  {player.name}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-white/55">
                                {player.out ? "out" : "not out"}
                              </p>
                            </div>
                            <span className="text-center font-semibold text-emerald-300">
                              {player.runs}
                            </span>
                            <span className="text-center text-white">
                              {player.balls}
                            </span>
                            <span className="text-center text-white/70">
                              {player.fours}/{player.sixes}
                            </span>
                            <span className="text-center text-amber-300">
                              {sr}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/60">
                        No batting records available yet.
                      </p>
                    )}
                  </div>
                </GlassPanel>

                {/* Bowling card */}
                <GlassPanel>
                  <SectionHeader eyebrow="Bowling card" title="Bowlers" />
                  <div className="grid grid-cols-5 gap-3 border-b border-white/10 px-3 pb-3 text-[11px] uppercase tracking-[0.18em] text-white/45">
                    <span>Bowler</span>
                    <span className="text-center">O</span>
                    <span className="text-center">R</span>
                    <span className="text-center">W</span>
                    <span className="text-center">Econ</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {Object.entries(bowling).length ? (
                      Object.entries(bowling).map(([name, stat]) => {
                        const overs = stat.overs ?? 0;
                        const runs = stat.runs ?? 0;
                        const wkts = stat.wickets ?? 0;
                        const economy =
                          overs > 0 ? (runs / overs).toFixed(1) : "0.0";
                        return (
                          <div
                            key={name}
                            className="grid grid-cols-5 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm hover:bg-white/[0.06]"
                          >
                            <span className="truncate text-white">{name}</span>
                            <span className="text-center text-white">
                              {overs}
                            </span>
                            <span className="text-center text-white">
                              {runs}
                            </span>
                            <span className="text-center font-semibold text-rose-300">
                              {wkts}
                            </span>
                            <span className="text-center text-sky-300">
                              {economy}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/60">
                        No bowling records available yet.
                      </p>
                    )}
                  </div>
                </GlassPanel>
              </div>

              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader eyebrow="Dismissals" title="Fall of Wickets" />
                  <div className="flex flex-wrap gap-3">
                    {wickets.length ? (
                      wickets.map((w, i) => (
                        <div key={i} className="text-xs text-white/60">
                          <span className="font-medium text-white">
                            {w.score}/{i + 1}
                          </span>{" "}
                          ({w.over})
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/60">No wickets yet.</p>
                    )}
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <SectionHeader eyebrow="Extras" title="Extras Breakdown" />
                  <div className="grid grid-cols-2 gap-3">
                    <StatPill label="Wides" value={extras?.wides ?? 0} />
                    <StatPill label="No Balls" value={extras?.noBalls ?? 0} />
                    <StatPill label="Byes" value={extras?.byes ?? 0} />
                    <StatPill label="Leg Byes" value={extras?.legByes ?? 0} />
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <SectionHeader eyebrow="Stand" title="Partnerships" />
                  <div className="space-y-2">
                    {partnerships.length ? (
                      partnerships.map((p, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm"
                        >
                          <span className="text-white">{p.players}</span>
                          <span className="font-semibold text-emerald-300">
                            {p.runs} runs
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/60">
                        No partnerships available yet.
                      </p>
                    )}
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <SectionHeader
                    eyebrow="Top batters"
                    title="Player Comparison"
                  />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    {topPlayers.length ? (
                      topPlayers.map((player) => {
                        const sr =
                          player.balls > 0
                            ? ((player.runs / player.balls) * 100).toFixed(1)
                            : "0.0";
                        return (
                          <div
                            key={player.name}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                          >
                            <p className="font-medium text-white">
                              {player.name}
                            </p>
                            <p className="mt-1 text-sm text-white/70">
                              {player.runs} ({player.balls})
                            </p>
                            <p className="mt-2 text-sm text-amber-300">
                              SR: {sr}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/60">
                        No comparison available yet.
                      </p>
                    )}
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin ── */}
        {activeTab === "admin" && isAdmin && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader eyebrow="Scoring" title="Admin Scoring Panel" />
              <div className="relative z-[9999] pointer-events-auto">
                <AdminScoringPanel matchId={match.slug} />
              </div>
            </GlassPanel>

            <div className="grid gap-6 xl:grid-cols-2">
              <GlassPanel>
                <SectionHeader eyebrow="Broadcast" title="Director Panel" />
                <BroadcastDirectorPanel />
              </GlassPanel>
              <GlassPanel>
                <SectionHeader
                  eyebrow="Broadcast"
                  title="Control Dashboard"
                />
                <BroadcastControlDashboard />
              </GlassPanel>
            </div>

            <GlassPanel>
              <SectionHeader
                eyebrow="Simulation"
                title="Simulation Controls"
              />
              <div className="flex flex-col gap-4">
                {!matchMeta ? (
                  <TeamSelector
                    onStart={(teamA, teamB) => {
                      const nextMeta = {
                        matchId: match.slug,
                        teamA: { id: teamA.short, name: teamA.name },
                        teamB: { id: teamB.short, name: teamB.name },
                      };
                      setMatchMeta(nextMeta);
                      setLocalMatchMeta(nextMeta);
                      setStartError(null);
                    }}
                  />
                ) : (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                    Teams Selected: {matchMeta.teamA.name} vs{" "}
                    {matchMeta.teamB.name}
                  </div>
                )}

                {matchMeta && !tossData && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                    <TossPanel
                      teamA={{ name: matchMeta?.teamA.name } as Team}
                      teamB={{ name: matchMeta?.teamB.name } as Team}
                      onConfirm={(winner, decision) =>
                        setTossData({ winner, decision })
                      }
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {/* ▶ START */}
                  <button
                    type="button"
                    disabled={effectiveIsRunning}
                    onClick={async () => {
                      const id = match.slug;
                      if (!id) return setStartError("Missing match id.");
                      if (!matchMeta)
                        return setStartError("Please select teams first.");
                      if (!tossData)
                        return setStartError("Please complete toss first.");
                      if (effectiveIsRunning) return;
                      const latestMeta = getMatchMeta(id);
                      if (!latestMeta?.teamA?.name || !latestMeta?.teamB?.name)
                        return setStartError("Please select teams first.");
                      connectRealtime(id);
                    }}
                    className={cls(
                      "rounded-xl px-4 py-2.5 font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60",
                      effectiveIsRunning
                        ? "bg-white/10"
                        : "bg-emerald-600 hover:bg-emerald-500"
                    )}
                  >
                    {isStarting
                      ? "Starting..."
                      : effectiveIsRunning
                      ? "Running"
                      : "▶ Start Simulation"}
                  </button>

                  {startError ? (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                      {startError}
                    </div>
                  ) : null}

                  {/* ⏸ PAUSE / ▶ RESUME */}
                  {effectiveIsRunning ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const endpoint = isPaused
                            ? "/api/simulation/resume"
                            : "/api/simulation/pause";
                          await fetch(endpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ matchId: match.slug }),
                          });
                          setIsPaused(!isPaused);
                          setStartError(null);
                        } catch (error) {
                          console.error(
                            "Failed to update simulation state",
                            error
                          );
                          setStartError("Failed to update simulation state.");
                        }
                      }}
                      className="rounded-xl bg-amber-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-amber-400"
                    >
                      {isPaused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                  ) : null}

                  {/* ⛔ STOP */}
                  {effectiveIsRunning ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch("/api/simulation/stop", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ matchId: match.slug }),
                          });
                          setIsRunning(false);
                          setIsPaused(false);
                        } catch (err) {
                          console.error("Stop failed", err);
                        }
                      }}
                      className="rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-500"
                    >
                      ⛔ Stop
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "0.25x", value: 6000 },
                    { label: "0.5x", value: 3000 },
                    { label: "1x", value: 1500 },
                    { label: "2x", value: 700 },
                    { label: "5x", value: 300 },
                    { label: "Ultra", value: 120 },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={async () => {
                        try {
                          setSpeed(option.value);
                          await fetch("/api/simulation/speed", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              matchId: match.slug,
                              speed: option.value,
                            }),
                          });
                        } catch (err) {
                          console.error("Speed update failed", err);
                        }
                      }}
                      className={cls(
                        "rounded-xl border px-3 py-2 text-sm transition",
                        speed === option.value
                          ? "border-sky-400/30 bg-sky-400/20 text-sky-200"
                          : "border-white/10 bg-white/[0.04] text-gray-300 hover:bg-white/[0.08]"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatPill
                    label="SSE status"
                    value={runtimeMonitor.isConnected ? "Connected" : "Disconnected"}
                    tone={runtimeMonitor.isConnected ? "green" : "red"}
                  />
                  <StatPill
                    label="Match channel"
                    value={runtimeMonitor.matchId ?? "—"}
                    tone="blue"
                  />
                  <StatPill
                    label="Subscribers"
                    value={runtimeMonitor.subscribers}
                    tone="amber"
                  />
                  <StatPill
                    label="Ready state"
                    value={runtimeMonitor.readyState ?? "—"}
                    tone="neutral"
                  />
                </div>
              </div>
            </GlassPanel>
          </div>
        )}
      </div>

      {/* ── Right rail ── */}
      <div className="hidden lg:block">
        <StickyInsightsRail match={match} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MatchInnerPage — MUST be rendered inside MatchProvider
// Gets all reactive state via useMatch()
// ─────────────────────────────────────────────

function MatchInnerPage({
  match,
  analytics,
  insights,
}: {
  match: Match;
  analytics: {
    winProbability: { over: number; value: number }[];
    momentum: { over: number; score: number }[];
  };
  insights: BroadcastInsight[];
}) {
  // ✅ Single reactive source — no local engineState
  const { state: currentEngineState } = useMatch();

  if (!currentEngineState) {
    return (
      <div className="p-10 text-center text-white">
        Loading match engine...
      </div>
    );
  }

  // ── Derived state (all from reactive currentEngineState) ──

  const currentInnings =
    currentEngineState.innings?.[
      currentEngineState.currentInningsIndex ?? 0
    ];

  const runs = Number(currentInnings?.runs ?? 0);
  const wickets = Number(currentInnings?.wickets ?? 0);
  const displayOver = formatOverDisplay(currentInnings?.overs);

  const inningsIndex = currentEngineState.currentInningsIndex ?? 0;

  const battingStats = getBattingStats(match.slug, inningsIndex) as Record<
    string,
    { runs?: number; balls?: number }
  >;
  const bowlingStats = getBowlingStats(match.slug, inningsIndex) as Record<
    string,
    { overs?: number; runs?: number; wickets?: number }
  >;

  const strikerName = currentInnings?.striker;
  const nonStrikerName = currentInnings?.nonStriker;

  const striker = strikerName
    ? {
        name: strikerName,
        runs: battingStats?.[strikerName]?.runs ?? 0,
        balls: battingStats?.[strikerName]?.balls ?? 0,
        isStriker: true,
      }
    : undefined;

  const nonStriker = nonStrikerName
    ? {
        name: nonStrikerName,
        runs: battingStats?.[nonStrikerName]?.runs ?? 0,
        balls: battingStats?.[nonStrikerName]?.balls ?? 0,
      }
    : undefined;

  const bowlerName = currentInnings?.currentBowler;
  const bowler = bowlerName
    ? {
        name: bowlerName,
        overs: bowlingStats?.[bowlerName]?.overs ?? 0,
        runs: bowlingStats?.[bowlerName]?.runs ?? 0,
        wickets: bowlingStats?.[bowlerName]?.wickets ?? 0,
      }
    : undefined;

  let lastOverBalls: string[] = [];
  if (currentInnings?.overs) {
    const overKeys = Object.keys(currentInnings.overs)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b);
    const lastKey = overKeys[overKeys.length - 1];
    const rawBalls = Array.isArray(currentInnings.overs[lastKey])
      ? currentInnings.overs[lastKey]
      : [];
    lastOverBalls = rawBalls.slice(0, 6).map(
      (b: {
        runs?: number;
        outcome?: string;
        extraType?: string;
        label?: string;
      }) => {
        if (b.outcome === "WICKET") return "W";
        if (b.extraType === "WD") return "Wd";
        if (b.extraType === "NB") return "Nb";
        if (b.runs === 6) return "6";
        if (b.runs === 4) return "4";
        return String(b.runs ?? b.label ?? 0);
      }
    );
  }

  const innings1 = currentEngineState.innings?.[0];
  const innings2 = currentEngineState.innings?.[1];
  const matchMeta = getMatchMeta(match.slug);

  const team1Name =
    matchMeta?.teamA?.name ??
    currentEngineState?.teamA?.name ??
    match?.team1 ??
    "Team A";

  const team2Name =
    matchMeta?.teamB?.name ??
    currentEngineState?.teamB?.name ??
    match?.team2 ??
    "Team B";

  // Target / RRR
  let target = 0;
  let runsNeeded = 0;
  let ballsLeft = 0;
  let rrr = 0;

  if (innings1 && innings2) {
    target = (innings1.runs ?? 0) + 1;
    const currentRuns = innings2.runs ?? 0;
    runsNeeded = target - currentRuns;
    const totalOvers = 20;
    const ballsBowled =
      Math.floor(displayOver) * 6 +
      Math.round((displayOver % 1) * 10);
    ballsLeft = totalOvers * 6 - ballsBowled;
    if (ballsLeft > 0) rrr = (runsNeeded / ballsLeft) * 6;
  }

  let crr = 0;
  if (currentInnings) {
    const ballsBowled =
      Math.floor(displayOver) * 6 +
      Math.round((displayOver % 1) * 10);
    if (ballsBowled > 0) crr = (runs / ballsBowled) * 6;
  }

  let winProbability = 50;
  if (innings2 && !currentEngineState.matchEnded && rrr > 0) {
    winProbability = Math.max(0, Math.min(100, 100 - rrr * 5));
  }

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8">
        {/* ── Hero ── */}
        <div className="mb-6">
          {currentInnings ? (
            <div className="space-y-4">
              <GlassPanel>
                <div className="flex flex-col gap-5">
                  {/* Header row */}
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300/80">
                        CricSmart Match Center
                      </p>
                      <h1 className="text-2xl font-semibold text-white md:text-3xl">
                        {team1Name} vs {team2Name}
                      </h1>
                      <p className="text-sm text-white/60">
                        Live simulation, analytics, commentary, and
                        innings-aware scorecard.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link
                          href="/"
                          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur-md transition"
                        >
                          ← Back to Home
                        </Link>
                      </motion.div>
                    </div>
                  </div>

                  {/* Match header (scoreboard) */}
                  <MatchHeader
                    team1={team1Name}
                    team2={team2Name}
                    runs={runs}
                    wickets={wickets}
                    over={Math.floor(displayOver)}
                    ball={Math.round((displayOver % 1) * 10)}
                    striker={striker}
                    nonStriker={nonStriker}
                    bowler={bowler}
                    lastOverBalls={lastOverBalls}
                  />

                  {/* Stats pills */}
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                    <StatPill
                      label={innings1?.battingTeam ?? "Team 1"}
                      value={`${innings1?.runs ?? 0}/${innings1?.wickets ?? 0}`}
                      tone="green"
                    />
                    <StatPill
                      label={innings2?.battingTeam ?? "Team 2"}
                      value={
                        innings2
                          ? `${innings2.runs}/${innings2.wickets}`
                          : "Yet to bat"
                      }
                      tone="blue"
                    />
                    <StatPill
                      label="Current innings"
                      value={`Innings ${(currentEngineState.currentInningsIndex ?? 0) + 1}`}
                      tone="neutral"
                    />
                    <StatPill
                      label="Current over"
                      value={displayOver}
                      tone="amber"
                    />
                    {innings2 && !currentEngineState.matchEnded && (
                      <StatPill label="Target" value={target} tone="neutral" />
                    )}
                    {innings2 && !currentEngineState.matchEnded && (
                      <StatPill
                        label="Need"
                        value={`${runsNeeded} in ${ballsLeft}`}
                        tone="amber"
                      />
                    )}
                    {innings2 && !currentEngineState.matchEnded && (
                      <StatPill
                        label="RRR"
                        value={rrr ? rrr.toFixed(2) : "0.00"}
                        tone="red"
                      />
                    )}
                    <StatPill
                      label="CRR"
                      value={crr ? crr.toFixed(2) : "0.00"}
                      tone="blue"
                    />
                    {innings2 && !currentEngineState.matchEnded && (
                      <StatPill
                        label="Win %"
                        value={`${winProbability.toFixed(0)}%`}
                        tone="green"
                      />
                    )}
                    {innings2 && !currentEngineState.matchEnded && (
                      <StatPill
                        label="Pressure"
                        value={
                          rrr > crr ? "High" : rrr > crr * 0.8 ? "Medium" : "Low"
                        }
                        tone={
                          rrr > crr ? "red" : rrr > crr * 0.8 ? "amber" : "green"
                        }
                      />
                    )}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                        Status
                      </p>
                      <div className="mt-2">
                        <LiveMatchStatus />
                      </div>
                    </div>
                  </div>

                  {/* Match result */}
                  {currentEngineState.matchEnded &&
                  currentEngineState.winner ? (
                    <div className="mt-3 border-t border-white/10 pt-3 text-center text-sm text-white">
                      {`${currentEngineState.winner} won by ${
                        typeof currentEngineState.winBy === "string"
                          ? currentEngineState.winBy
                          : typeof currentEngineState.winBy === "number"
                          ? innings2 && (innings2.runs ?? 0) >= target
                            ? `${currentEngineState.winBy} wickets`
                            : `${currentEngineState.winBy} runs`
                          : "result unavailable"
                      }${
                        innings2 &&
                        (innings2.runs ?? 0) >= target &&
                        ballsLeft > 0
                          ? ` with ${ballsLeft} balls left`
                          : ""
                      }`}
                    </div>
                  ) : null}
                </div>
              </GlassPanel>
            </div>
          ) : null}
        </div>

        {/* ── Tabs ── */}
        <TabsArea match={match} analytics={analytics} insights={insights} />
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// MatchDetailPage — outer shell
// Handles: metadata loading, analytics events, effects
// MatchProvider wraps everything with correct matchId prop ✅
// ─────────────────────────────────────────────

export default function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);

  const matchId: string | undefined = useMemo(() => {
    const slug = resolvedParams.slug;
    if (typeof slug === "string") return slug;
    if (Array.isArray(slug)) return slug[0];
    return undefined;
  }, [resolvedParams.slug]);

  // ✅ Only non-reactive metadata lives here
  const [match, setMatch] = useState<Match | undefined>();
  const [insights, setInsights] = useState<BroadcastInsight[]>([]);

  type WinPoint = { over: number; value: number };
  type MomentumPoint = { over: number; score: number };

  const [analytics, setAnalytics] = useState<{
    winProbability: WinPoint[];
    momentum: MomentumPoint[];
  }>({ winProbability: [], momentum: [] });

  // One-time inits
  useEffect(() => {
    initTacticalOverlayBridge();
    initCommentaryVoice();
  }, []);

  useEffect(() => {
    enableBroadcast();
    return () => disableBroadcast();
  }, []);

  // Load match metadata + hydrate both matchEngine AND eventStore
  useEffect(() => {
    if (!matchId) return;
    const id = matchId;
    let cancelled = false;

    async function loadMatch() {
      try {
        const res = await fetch(`/api/match/${id}`, { cache: "no-store" });

        if (!res.ok) {
          console.error("MATCH API ERROR", await res.text());
          return;
        }

        const data = await res.json();

        if (!data?.success || !data?.match) {
          console.error("Match not found in Redis for", id);
          return;
        }

        // ✅ Hydrate matchEngine (for scorecard helpers etc.)
        hydrateMatchState(id, data.match);

        // ✅ CRITICAL: also push into eventStore so MatchProvider sees initial state
        setMatchState(id, data.match);

        if (!cancelled) {
          setMatch({
            id,
            slug: id,
            team1: data.match.teamA?.name ?? "Team A",
            team2: data.match.teamB?.name ?? "Team B",
            currentOver: 0,
            currentBall: 0,
            status: data.match.matchEnded ? "Completed" : "Live",
          });
        }
      } catch (err) {
        console.error("LOAD MATCH ERROR", err);
      }
    }

    loadMatch();
    return () => { cancelled = true; };
  }, [matchId]);

  // Match init API (one-shot)
  const hasInitialized = useRef(false);
  const [initTeams] = useState(() => ({
      teamA: match?.team1 ?? "Team A",
      teamB: match?.team2 ?? "Team B",
    }));
  useEffect(() => {
    if (!matchId || hasInitialized.current) return;
    hasInitialized.current = true;

    fetch("/api/match/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        teamA: initTeams.teamA,
        teamB: initTeams.teamB,
        type: "LIVE",
        externalMatchId: matchId,
      }),
    });
  }, [initTeams, matchId]);

  // Analytics / insights from window events
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: string;
        insights?: BroadcastInsight[];
        analytics?: {
          winProbability: WinPoint[];
          momentum: MomentumPoint[];
        };
      }>;
      const data = customEvent.detail;

      if (data.type === "BALL_EVENT") {
        if (data.insights) setInsights(data.insights);
        if (data.analytics) setAnalytics(data.analytics);
      }
    };

    window.addEventListener("CRIC_UPDATE", handler);
    return () => window.removeEventListener("CRIC_UPDATE", handler);
  }, []);

  // ── Render ──

  if (!matchId) {
    return (
      <PageMotion>
        <div className="bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#071120_35%,#0b1220_65%,#020617_100%)]">
          <div className="p-10 text-center text-white">
            Invalid match URL.
          </div>
        </div>
      </PageMotion>
    );
  }

  return (
    // ✅ FIX: matchId prop — NOT value prop
    <MatchProvider matchId={matchId}>
      <PageMotion>
        <div className="bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),transparent_24%),linear-gradient(180deg,#020617_0%,#071120_35%,#0b1220_65%,#020617_100%)]">
          {match ? (
            <MatchInnerPage
              match={match}
              analytics={analytics}
              insights={insights}
            />
          ) : (
            <div className="p-10 text-center text-white">
              Loading match...
            </div>
          )}
        </div>
      </PageMotion>
    </MatchProvider>
  );
}
