"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminScoringPanel from "@/components/admin/AdminScoringPanel";
import BroadcastControlDashboard from "@/components/BroadcastControlDashboard";
import BroadcastDirectorPanel from "@/components/BroadcastDirectorPanel";
import CommentaryPanel from "@/components/match/CommentaryPanel";
import GlassPanel from "@/components/ui/GlassPanel";
import HighlightTimeline from "@/components/HighlightTimeline";
import LiveMatchStatus, {
  getLiveMatchStatusLabel,
} from "@/components/LiveMatchStatus";
import MatchControlPanel from "@/components/MatchControlPanel";
import MatchHeader from "@/components/MatchHeader";
import MatchInsightsPanel from "@/components/analytics/MatchInsightsPanel";
import MatchNarrativePanel from "@/components/analytics/MatchNarrativePanel";
import MatchStory from "@/components/MatchStory";
import MatchGraphExplorer from "@/components/match/MatchGraphExplorer";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import OversTimeline from "@/components/OversTimeline";
import PageMotion from "@/components/ui/PageMotion";
import PartnershipPanel from "@/components/PartnershipPanel";
import ReplaySlider from "@/components/match/ReplaySlider";
import TeamSelector from "@/components/teams/TeamSelector";
import TossPanel from "@/components/match/TossPanel";
import { getMatchMeta, subscribeStore } from "@/store/matchStore";
import { MatchProvider, useMatch } from "@/context/MatchContext";
import {
  shallowEqual,
  useCurrentBatters,
  useCurrentInningsOvers,
  useMatchSelector,
  useScore,
} from "@/services/matchSelectors";
import { teams, Team } from "@/data/teams";
import { Match } from "@/types/match";
import { motion } from "framer-motion";

// ✅ Only keep what's needed from matchEngine
import {
  hydrateMatchState,
  MatchState,
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
import { getMatchBySlug } from "@/services/matchService";
import { connectRealtime } from "@/services/realtime/connectRealtime";
import type { MatchReconnectHealth } from "@/services/match/matchRegistry";
import type { LiveSessionState } from "@/types/liveSession";
import {
  getBattingOrder,
  getBowlingOrder,
} from "@/services/simulation/lineup";
import { initTacticalOverlayBridge } from "@/services/tacticalOverlayBridge";
import WagonWheel from "@/components/analytics/WagonWheel";
import { calculateWinProbability } from "@/services/analytics/calculateWinProbability";
import { setMatchMeta } from "@/store/matchStore";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import AnimatedScore from "@/components/ui/AnimatedScore";
import ConnectionStatus from "@/components/ui/ConnectionStatus";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type AnalysisFilter = "ALL" | "BATTING" | "BOWLING" | "PRESSURE";
type MainTab =
  | "overview"
  | "live"
  | "analysis"
  | "overs"
  | "squad"
  | "scorecard"
  | "admin";

const AUTO_RECONNECT_SUBSCRIBER_ID = "match-detail-page-auto";

type PlayerStat = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
};

type BowlerStat = {
  overs?: number;
  runs?: number;
  wickets?: number;
};

type SquadRole = "BAT" | "BOWL" | "AR" | "WK";
type SquadPlayer = {
  name: string;
  role: SquadRole;
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

type MatchSessionMeta = {
  type?: "LIVE" | "SIMULATION";
  sessionState?: LiveSessionState;
  reconnectHealth?: MatchReconnectHealth;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isSquadRole(role: string): role is SquadRole {
  return role === "BAT" || role === "BOWL" || role === "AR" || role === "WK";
}

function normalizeSquadPlayers(
  squad?: Array<{ name?: string; role?: string }>
): SquadPlayer[] {
  return (squad ?? []).flatMap((player) => {
    const name = player?.name?.trim();
    const role = player?.role?.trim();

    if (!name || !role || !isSquadRole(role)) return [];

    return [{ name, role }];
  });
}

function findTeamSquadByName(teamName: string): SquadPlayer[] {
  const team = teams.find((item) => item.name === teamName);
  return normalizeSquadPlayers(team?.squad);
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
    <div
      className={cls(
        "flex h-full min-h-[70px] flex-col justify-between rounded-xl border px-3 py-2.5",
        toneMap[tone]
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
        {label}
      </p>
      <div className="mt-2 text-sm font-semibold text-white">{value}</div>
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
    <div className="mb-3 flex items-start justify-between gap-3">
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

function StickyInsightsRail({
  match,
  sessionMeta,
}: {
  match: Match;
  sessionMeta?: MatchSessionMeta | null;
}) {
  const score = useScore(match.slug);
  const batters = useCurrentBatters(match.slug);
  const currentInningsIndex = useMatchSelector(
    match.slug,
    (state) => state.currentInningsIndex
  );
  const teams = useMatchSelector(
    match.slug,
    (state) => {
      const innings = state.innings[state.currentInningsIndex];
      return {
        battingTeam: innings?.battingTeam ?? "TBD",
        bowlingTeam: innings?.bowlingTeam ?? "TBD",
      };
    },
    shallowEqual
  );
  const overs = useCurrentInningsOvers(match.slug);

  const overKeys = overs
    ? Object.keys(overs)
        .map(Number)
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
    : [];

  const lastOverKey = overKeys.length ? overKeys[overKeys.length - 1] : undefined;

  const lastOverBalls =
    lastOverKey !== undefined &&
    Array.isArray(overs?.[lastOverKey])
      ? overs[lastOverKey].slice(0, 6)
      : [];

  return (
    <div className="space-y-4 lg:sticky lg:top-28">
      <GlassPanel>
        <SectionHeader eyebrow="Live pulse" title="Match Snapshot" />
        <div className="grid grid-cols-1 gap-3">
          <StatPill
            label="Current innings"
            value={`Innings ${(currentInningsIndex ?? 0) + 1}`}
            tone="blue"
          />
          <StatPill
            label="Batting team"
            value={teams?.battingTeam ?? "TBD"}
            tone="green"
          />
          <StatPill
            label="Bowling team"
            value={teams?.bowlingTeam ?? "TBD"}
            tone="amber"
          />
          <StatPill
            label="Score"
            value={
              <AnimatedScore
                value={`${score.runs}/${score.wickets}`}
              />
            }
            tone="neutral"
          />
          <StatPill label="Over" value={score.overs} tone="neutral" />
          <StatPill
            label="Striker"
            value={batters?.striker || "—"}
            tone="green"
          />
          <StatPill
            label="Non-striker"
            value={batters?.nonStriker || "—"}
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
          <LiveMatchStatus
            matchId={match.slug}
            sessionState={sessionMeta?.sessionState}
            reconnectHealth={sessionMeta?.reconnectHealth}
          />
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
  sessionMeta,
}: {
  match: Match;
  analytics: {
    winProbability: { over: number; value: number }[];
    momentum: { over: number; score: number }[];
  };
  insights: BroadcastInsight[];
  sessionMeta?: MatchSessionMeta | null;
}) {
  const isAdmin = true;
  const { state: currentEngineState } = useMatch();
  const [, forceMatchStoreUpdate] = useState(0);
  const [matchMeta, setLocalMatchMeta] = useState(() =>
    getMatchMeta(match.slug)
  );
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<MainTab>("overview");

  useEffect(() => {
    const tab = searchParams.get("tab") as MainTab;
    if (!tab) return;
    setTimeout(() => setActiveTab(tab), 0);
  }, [searchParams]);

  const [showExpandedAnalytics, setShowExpandedAnalytics] = useState(false);
  const [tossData, setTossData] = useState<{
    winner: Team;
    decision: "BAT" | "BOWL";
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1500);
  const [showReplayTimeline, setShowReplayTimeline] = useState(false);

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
  const winProbabilityData = useMemo(
    () => calculateWinProbability(analytics.winProbability),
    [analytics.winProbability]
  );
  const latestWinPoint = winProbabilityData.length
    ? winProbabilityData[winProbabilityData.length - 1]
    : null;

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

  const batting = getBattingStats(match.slug, inningsIndex) as Record<
    string,
    PlayerStat
  >;
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

  const normalizedTeamASquad = normalizeSquadPlayers(
    currentEngineState?.teamA?.squad
  );
  const normalizedTeamBSquad = normalizeSquadPlayers(
    currentEngineState?.teamB?.squad
  );

  const squadTeams = [
    {
      name: currentEngineState?.teamA?.name || match.team1,
      squad: normalizedTeamASquad,
    },
    {
      name: currentEngineState?.teamB?.name || match.team2,
      squad: normalizedTeamBSquad,
    },
  ].map((team) => {
    const fallbackSquad = findTeamSquadByName(team.name);
    const squad = team.squad.length ? team.squad : fallbackSquad;

    return {
      ...team,
      squad,
      battingOrder: squad.length ? getBattingOrder(squad) : [],
      bowlingOrder: squad.length ? getBowlingOrder(squad) : [],
    };
  });

  const tabs: MainTab[] = [
    "overview",
    "live",
    "analysis",
    "overs",
    "squad",
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

  const overviewBattingTeam =
    inningsData?.battingTeam ??
    currentEngineState?.innings?.[currentEngineState.currentInningsIndex]?.battingTeam ??
    matchMeta?.teamA?.name ??
    match.team1;
  const overviewBowlingTeam =
    inningsData?.bowlingTeam ??
    currentEngineState?.innings?.[currentEngineState.currentInningsIndex]?.bowlingTeam ??
    matchMeta?.teamB?.name ??
    match.team2;
  const inningsRunRate =
    inningsData && (inningsData.over > 0 || inningsData.ball > 0)
      ? (inningsData.runs / (inningsData.over + inningsData.ball / 6)).toFixed(2)
      : "0.00";
  return (
    <div
      className={cls(
        "grid gap-4",
        activeTab === "live"
          ? "grid-cols-1"
          : "lg:grid-cols-[minmax(0,1fr)_300px]"
      )}
    >
      <div className="min-w-0">
        {/* ── Tab Bar ── */}
        <div className="sticky top-24 z-20 mb-4 overflow-x-auto">
  <div
    className="inline-flex min-w-full"
    style={{ borderBottom: "1px solid var(--border-subtle)" }}
  >
    {tabs.map((tab) => {
      const isActive = activeTab === tab;
      return (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          style={{
            color: isActive ? "var(--text-primary)" : "var(--text-muted)",
            borderBottom: isActive
              ? "2px solid var(--accent-brand)"
              : "2px solid transparent",
            marginBottom: "-1px",
          }}
          className="px-4 py-3 text-sm font-medium capitalize whitespace-nowrap transition-colors hover:text-[var(--text-primary)]"
        >
          {tab}
        </button>
      );
    })}
  </div>
</div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <GlassPanel>
              <SectionHeader
                eyebrow="Match center"
                title="Overview"
                action={
                  <LiveMatchStatus
                    matchId={match.slug}
                    sessionState={sessionMeta?.sessionState}
                    reconnectHealth={sessionMeta?.reconnectHealth}
                  />
                }
              />
              <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
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

            <div className="space-y-4">
              <GlassPanel>
                <SectionHeader eyebrow="Control" title="Match Controls" />
                {sessionMeta?.type === "LIVE" ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/70">
                    Live sessions connect automatically. Simulation controls are hidden for provider-driven matches.
                  </div>
                ) : (
                  <MatchControlPanel matchId={match.slug} />
                )}
              </GlassPanel>

              <GlassPanel>
                <SectionHeader eyebrow="Narrative" title="Match Story" />
                <MatchStory matchId={match.slug} />
              </GlassPanel>

              <GlassPanel>
                <MatchGraphExplorer
                  currentBattingTeam={overviewBattingTeam}
                  currentBowlingTeam={overviewBowlingTeam}
                  currentOver={displayOver}
                  currentRunRate={inningsRunRate}
                  innings={currentEngineState?.innings ?? []}
                  momentumData={analytics.momentum}
                  winProbabilityData={winProbabilityData}
                />
              </GlassPanel>

              <div className="grid gap-4 lg:grid-cols-2">
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
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
            <GlassPanel className="p-3">
              <SectionHeader eyebrow="Ball by ball" title="Live Commentary" />
              <CommentaryPanel matchId={match.slug} insights={insights} />
            </GlassPanel>

            <div className="space-y-3">
              <GlassPanel className="p-3">
                <SectionHeader eyebrow="Live pulse" title="Session Status" />
                <LiveMatchStatus
                  matchId={match.slug}
                  sessionState={sessionMeta?.sessionState}
                  reconnectHealth={sessionMeta?.reconnectHealth}
                />
              </GlassPanel>

              <GlassPanel className="p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300/80">
                      Replay
                    </p>
                    <p className="text-xs text-white/65">
                      Open compact replay controls only when needed.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReplayTimeline((prev) => !prev)}
                    className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/[0.08]"
                  >
                    {showReplayTimeline ? "Hide Replay" : "Open Replay"}
                  </button>
                </div>
                {showReplayTimeline ? (
                  <div className="mt-2.5">
                    <ReplaySlider matchId={match.slug} />
                  </div>
                ) : null}
              </GlassPanel>
            </div>
          </div>
        )}

        {/* ── Analysis ── */}
        {activeTab === "analysis" && (
          <div className="space-y-3">
            <GlassPanel className="p-3">
              <SectionHeader eyebrow="Unified module" title="Match Analytics" />
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-[0.18em] text-sky-300/80">
                      Probability · Pressure · Momentum
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowExpandedAnalytics((prev) => !prev)}
                      className="rounded-md border border-white/15 bg-white/[0.05] px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-white/85"
                    >
                      {showExpandedAnalytics ? "Collapse Analytics" : "Expand Analytics"}
                    </button>
                  </div>
                  <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-200/85">Batting Win</p>
                      <p className="text-sm font-semibold text-emerald-100">{(latestWinPoint?.batting ?? 50).toFixed(0)}%</p>
                    </div>
                    <div className="rounded-lg border border-red-400/25 bg-red-500/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-red-200/85">Bowling Win</p>
                      <p className="text-sm font-semibold text-red-100">{(latestWinPoint?.bowling ?? 50).toFixed(0)}%</p>
                    </div>
                    <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-amber-200/85">Pressure</p>
                      <p className="text-sm font-semibold text-amber-100">
                        {(latestWinPoint?.batting ?? 50) > 60 ? "Batting control" : (latestWinPoint?.batting ?? 50) < 40 ? "Bowling control" : "Balanced"}
                      </p>
                    </div>
                  </div>
                </div>

                {showExpandedAnalytics ? (
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <SectionHeader eyebrow="Charts" title="Win Probability & Trend" />
                        <MatchGraphExplorer
                          currentBattingTeam={overviewBattingTeam}
                          currentBowlingTeam={overviewBowlingTeam}
                          currentOver={displayOver}
                          currentRunRate={inningsRunRate}
                          innings={currentEngineState?.innings ?? []}
                          momentumData={analytics.momentum}
                          winProbabilityData={winProbabilityData}
                        />
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <SectionHeader eyebrow="Momentum" title="Compact Heatmap" />
                        <MomentumHeatmap data={analytics.momentum} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <SectionHeader eyebrow="Signals" title="Insights Feed" />
                        <MatchInsightsPanel matchId={match.slug} />
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <SectionHeader eyebrow="Narrative" title="Storyline" />
                        <MatchNarrativePanel matchId={match.slug} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </GlassPanel>

            <GlassPanel className="p-3">
              <SectionHeader eyebrow="Shot analysis" title="Wagon Wheel" />
              <div className="flex h-[260px] items-center justify-center text-white/60">
                <WagonWheel matchId={match.slug} />
              </div>
            </GlassPanel>
          </div>
        )}

        {/* ── Overs ── */}
        {activeTab === "overs" && (
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

        {activeTab === "squad" && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader eyebrow="Team sheets" title="Squads" />
              <div className="grid gap-6 xl:grid-cols-2">
                {squadTeams.map((team) => (
                  <div
                    key={team.name}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-white">
                          {team.name}
                        </h4>
                        <p className="mt-1 text-xs text-white/55">
                          {team.squad.length} players available
                        </p>
                      </div>
                    </div>

                    {team.squad.length ? (
                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          {team.squad.map((player, index) => (
                            <div
                              key={`${team.name}-${player.name}`}
                              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm"
                            >
                              <span className="text-white">
                                {index + 1}. {player.name}
                              </span>
                              <span className="text-xs font-medium uppercase tracking-[0.14em] text-sky-200/80">
                                {player.role}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                              Projected batting order
                            </p>
                            <p className="mt-2 text-sm text-white/75">
                              {team.battingOrder.length
                                ? team.battingOrder.join(" · ")
                                : "Not available"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                              Projected bowling order
                            </p>
                            <p className="mt-2 text-sm text-white/75">
                              {team.bowlingOrder.length
                                ? team.bowlingOrder.join(" · ")
                                : "Not available"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-white/60">
                        Squad details are not available yet.
                      </p>
                    )}
                  </div>
                ))}
              </div>
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
                      onConfirm={(winner, decision) => {
                        setTossData({ winner, decision });
                        const nextMeta = {
                          ...matchMeta,
                          toss: { winner: winner.name, decision },
                        };
                        setMatchMeta(nextMeta);
                        setLocalMatchMeta(nextMeta);
                      }}
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
                      connectRealtime(id, "match-page-admin-start");
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
                    { label: "1x", value: 1500 },
                    { label: "2x", value: 700 },
                    { label: "5x", value: 300 },
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
              </div>
            </GlassPanel>
          </div>
        )}
      </div>

      {/* ── Right rail ── */}
      {activeTab !== "live" ? (
        <div className="hidden lg:block">
          <StickyInsightsRail match={match} sessionMeta={sessionMeta} />
        </div>
      ) : null}
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
  sessionMeta,
}: {
  match: Match;
  analytics: {
    winProbability: { over: number; value: number }[];
    momentum: { over: number; score: number }[];
  };
  insights: BroadcastInsight[];
  sessionMeta?: MatchSessionMeta | null;
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

  return (
    <main className="relative overflow-hidden">
      <div className="mx-auto max-w-[1500px] px-3 py-3 md:px-5 lg:px-6">
        {/* ── Hero ── */}
        <div className="mb-3">
          {currentInnings ? (
            <div className="space-y-2.5">
              <GlassPanel>
                <div className="flex flex-col gap-3">
                  {/* Header row */}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300/80">
                        CricSmart Match Center
                      </p>
                      <h1 className="text-xl font-semibold text-white md:text-2xl">
                        {team1Name} vs {team2Name}
                      </h1>
                      <p className="text-xs text-white/60">
                        Live command center with realtime commentary, analytics, and replay.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <ConnectionStatus hideWhenConnected={false} />
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
  isLive={!currentEngineState.matchEnded}
  matchEnded={currentEngineState.matchEnded}
  winner={currentEngineState.winner}
  winBy={currentEngineState.winBy}
  target={innings2 ? target : undefined}
  rrr={innings2 && !currentEngineState.matchEnded ? rrr : undefined}
  crr={crr}
/>

                  {/* Stats pills */}
                  <div className="grid auto-rows-fr gap-2 md:grid-cols-3 xl:grid-cols-8">
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
                    <StatPill
                      label="Status"
                      value={
                        getLiveMatchStatusLabel(currentEngineState.matchEnded, sessionMeta?.sessionState)
                      }
                      tone="neutral"
                    />
                  </div>
                </div>
              </GlassPanel>
            </div>
          ) : null}
        </div>

        {/* ── Tabs ── */}
        <TabsArea
          match={match}
          analytics={analytics}
          insights={insights}
          sessionMeta={sessionMeta}
        />
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
  const [sessionMeta, setSessionMeta] = useState<MatchSessionMeta | null>(null);
  const [insights, setInsights] = useState<BroadcastInsight[]>([]);

  type WinPoint = {
    over: number;
    value: number;
    confidence?: number;
    delta?: number;
    modelVersion?: string;
    timestamp?: number;
    marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
  };
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

        setSessionMeta(data.registry ?? null);

        // ✅ CRITICAL: also push into eventStore so MatchProvider sees initial state
        setMatchState(id, data.match);

        // ✅ Restore in-memory matchMeta from persisted engine state so the
        //    match page renders correct team names after a page reload/return.
        const teamAName = data.match.teamA?.name;
        const teamBName = data.match.teamB?.name;
        const getTeamIdOrSlug = (existingId: unknown, name: string) => {
          if (typeof existingId === "string" && existingId.trim()) {
            return existingId;
          }
          return name.toLowerCase().trim().replace(/\s+/g, "-");
        };
        if (teamAName && teamBName) {
          setMatchMeta({
            matchId: id,
            teamA: {
              id: getTeamIdOrSlug(data.match.teamA?.id, teamAName),
              name: teamAName,
            },
            teamB: {
              id: getTeamIdOrSlug(data.match.teamB?.id, teamBName),
              name: teamBName,
            },
            ...(data.match.tossWinner && data.match.tossDecision
              ? { toss: { winner: data.match.tossWinner, decision: data.match.tossDecision } }
              : {}),
          });
        }

        if (!cancelled) {
          setMatch({
            id,
            slug: id,
            team1: teamAName ?? "Team A",
            team2: teamBName ?? "Team B",
            currentOver: 0,
            currentBall: 0,
            status: data.match.matchEnded ? "Completed" : "Live",
          });
        }

        // ✅ Auto-connect SSE so live updates flow when returning to the page
        //    while a simulation is still running in the backend.
        const runtime = data.runtime;
        const isRunning = runtime?.isRunning === true && !data.match.matchEnded;
        if (!cancelled && isRunning) {
          // connectRealtime is safe to call if already connected — it's a no-op
          connectRealtime(id, AUTO_RECONNECT_SUBSCRIBER_ID, {
            autoStartSimulation: data.registry?.type !== "LIVE",
          });
        }
      } catch (err) {
        console.error("LOAD MATCH ERROR", err);
      }
    }

    loadMatch();
    return () => { cancelled = true; };
  }, [matchId]);

  // Analytics / insights from window events
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: string;
        insights?: BroadcastInsight[];
        analytics?: {
          winProbability: WinPoint[];
          momentum: MomentumPoint[];
          prediction?: {
            currentProbability: number;
            previousProbability: number;
            probabilityDelta: number;
            confidence: number;
            modelVersion: string;
            predictionTimestamp: number;
            latencyMs: number;
            cacheHit: boolean;
            debounced: boolean;
          };
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
              sessionMeta={sessionMeta}
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
