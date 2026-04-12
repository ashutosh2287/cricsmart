"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";

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

import { MatchProvider, useMatch } from "@/context/MatchContext";
import { Team } from "@/data/teams";
import { Match } from "@/types/match";

import {
  getMatchState,
  hydrateMatchState,
  initMatch,
  MatchState,
  subscribeMatch,
} from "@/services/matchEngine";

import { enableBroadcast, disableBroadcast } from "@/services/broadcastMode";
import { initCommentaryVoice } from "@/services/commentary/commentaryVoiceEngine";
import {
  getBattingStats,
  getBowlingStats,
  getExtras,
  getFallOfWickets,
} from "@/services/analytics/scorecardEngine";
import { startLiveMatchIngestor, stopLiveMatchIngestor } from "@/services/ingestion/liveMatchIngestor";
import { getMatchBySlug } from "@/services/matchService";
import { connectRealtime, disconnectRealtime } from "@/services/realtimeService";
import {
  getBattingOrder,
  getBowlingOrder,
} from "@/services/simulation/lineup";
import {
  pauseSimulation,
  resumeSimulation,
  setSimulationSpeed,
  startSimulation,
  stopSimulation,
} from "@/services/simulation/matchSimulator";
import { initTacticalOverlayBridge } from "@/services/tacticalOverlayBridge";
import WagonWheel from "@/components/analytics/WagonWheel";

type AnalysisFilter = "ALL" | "BATTING" | "BOWLING" | "PRESSURE";
type MainTab = "overview" | "live" | "analysis" | "timeline" | "scorecard" | "admin";

type PlayerStat = {
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  out?: boolean;
};

type BowlerStat = {
  overs?: number;
  runs?: number;
  wickets?: number;
};

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatOverDisplay(overs?: Record<string, unknown[]>) {
  if (!overs) return 0;
  const keys = Object.keys(overs);
  if (!keys.length) return 0;

  const currentOverNumber = Number(keys[keys.length - 1]);
  const currentBalls = overs[currentOverNumber]?.length || 0;

  return currentBalls === 6
    ? currentOverNumber + 1
    : currentOverNumber + currentBalls / 10;
}

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
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
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

function StickyInsightsRail({
  match,
}: {
  match: Match;
}) {
  const { state } = useMatch();

  const inningsIndex = state?.currentInningsIndex ?? 0;
  const currentInnings = state?.innings?.[inningsIndex];
  const displayOver = formatOverDisplay(currentInnings?.overs);

  const lastOverKey = currentInnings?.overs
    ? Object.keys(currentInnings.overs).at(-1)
    : undefined;

  const lastOverBalls = lastOverKey
    ? currentInnings?.overs?.[Number(lastOverKey)] ?? []
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
            value={`${currentInnings?.runs ?? 0}/${currentInnings?.wickets ?? 0}`}
            tone="neutral"
          />
          <StatPill label="Over" value={displayOver} tone="neutral" />
          <StatPill label="Striker" value={currentInnings?.striker ?? "—"} tone="green" />
          <StatPill label="Non-striker" value={currentInnings?.nonStriker ?? "—"} tone="blue" />
          <StatPill label="Bowler" value={"—"} tone="amber" />
        </div>
      </GlassPanel>

      <GlassPanel>
        <SectionHeader eyebrow="Recent action" title="Current Over" />
        <div className="flex flex-wrap gap-2">
          {lastOverBalls.length ? (
            lastOverBalls.map((ball: { runs?: number; label?: string; outcome?: string }, index: number)=> (
              <div
                key={index}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white"
              >
                {ball?.runs ?? ball?.label ?? ball?.outcome ?? "•"}
              </div>
            ))
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
              {match.team1} vs {match.team2}
            </p>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}

const TabsArea = React.memo(function TabsArea({ match }: { match: Match }) {
  const { state: currentEngineState } = useMatch();

  const [activeTab, setActiveTab] = useState<MainTab>("overview");
  const [analysisFilter, setAnalysisFilter] = useState<AnalysisFilter>("ALL");
  const [selectedTeams, setSelectedTeams] = useState<{
    teamA: Team;
    teamB: Team;
  } | null>(null);
  const [tossData, setTossData] = useState<{
    winner: Team;
    decision: "BAT" | "BOWL";
  } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1500);
  const [selectedInnings, setSelectedInnings] = useState<number | null>(null);

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
  const displayOver = formatOverDisplay(inningsData?.overs);

  const batting = getBattingStats(match.slug, inningsIndex) as Record<string, PlayerStat>;
  const bowling = getBowlingStats(match.slug, inningsIndex) as Record<string, BowlerStat>;
  const extras = getExtras(match.slug, inningsIndex);
  const wickets = (getFallOfWickets(match.slug, inningsIndex) ?? []).filter(Boolean);

  const players = Object.entries(batting).filter(([_, p]) => (p?.balls ?? 0) > 0);
  const topPlayers = [...players]
    .sort((a, b) => (b[1].runs ?? 0) - (a[1].runs ?? 0))
    .slice(0, 2);

  const partnerships = players.slice(0, -1).map(([name, stat], i) => {
    const next = players[i + 1];
    return {
      players: `${name} & ${next?.[0] ?? ""}`,
      runs: (stat.runs ?? 0) + (next?.[1]?.runs ?? 0),
    };
  });

  const tabs: MainTab[] = ["overview", "live", "analysis", "timeline", "scorecard", "admin"];

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
    {
      label: "Over",
      value: displayOver,
      tone: "amber" as const,
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="sticky top-24 z-20 mb-6 overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-2 backdrop-blur-xl">
            {tabs.map((tab) => {
              if (tab === "admin" && process.env.NODE_ENV !== "development") return null;

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
                  <WinProbabilityChart matchId={match.slug} />
                </GlassPanel>

                <div className="grid gap-6 lg:grid-cols-2">
                  <GlassPanel>
                    <SectionHeader eyebrow="Flow" title="Momentum" />
                    <MomentumHeatmap matchId={match.slug} />
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

        {activeTab === "live" && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader eyebrow="Ball by ball" title="Live Commentary" />
              <CommentaryPanel matchId={match.slug} />
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
                    label={currentEngineState?.teamA?.name ?? match.team1}
                    value={`${currentEngineState?.innings?.[0]?.runs ?? 0}/${currentEngineState?.innings?.[0]?.wickets ?? 0}`}
                    tone="green"
                  />
                  <StatPill
                    label={currentEngineState?.teamB?.name ?? match.team2}
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
                  <StatPill
                    label="Current bowler"
                    value={"—"}
                    tone="red"
                  />
                </div>
              </GlassPanel>
            </div>
          </div>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-6">

            <GlassPanel>
              <SectionHeader eyebrow="Filters" title="Analysis View" />
              <div className="flex flex-wrap gap-3">
                {[
                  { key: "ALL", label: "All", active: "bg-sky-500 text-slate-950" },
                  { key: "BATTING", label: "Batting", active: "bg-emerald-500 text-slate-950" },
                  { key: "BOWLING", label: "Bowling", active: "bg-rose-500 text-white" },
                  { key: "PRESSURE", label: "Pressure", active: "bg-amber-500 text-slate-950" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setAnalysisFilter(f.key as AnalysisFilter)}
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

  <div className="h-[300px] flex items-center justify-center text-white/60">
    <WagonWheel matchId={match.slug} />
  </div>
</GlassPanel>

            {analysisFilter === "ALL" && (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
                <div className="space-y-6">
                  <GlassPanel>
                    <SectionHeader eyebrow="Model" title="Win Probability" />
                    <WinProbabilityChart matchId={match.slug} />
                  </GlassPanel>
                  <GlassPanel>
                    <SectionHeader eyebrow="Energy" title="Momentum Heatmap" />
                    <MomentumHeatmap matchId={match.slug} />
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
                  <SectionHeader eyebrow="Batting" title="Run Pressure & Projection" />
                  <WinProbabilityChart matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader eyebrow="Pairs" title="Partnership Strength" />
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
                  <SectionHeader eyebrow="Bowling" title="Momentum Swing" />
                  <MomentumHeatmap matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader eyebrow="Insights" title="Pressure Signals" />
                  <MatchInsightsPanel matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader eyebrow="Moments" title="Bowling Highlights" />
                  <HighlightTimeline matchId={match.slug} />
                </GlassPanel>
              </div>
            )}

            {analysisFilter === "PRESSURE" && (
              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader eyebrow="Pressure" title="Win Pressure Curve" />
                  <WinProbabilityChart matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader eyebrow="Pressure" title="Momentum Zones" />
                  <MomentumHeatmap matchId={match.slug} />
                </GlassPanel>
                <GlassPanel>
                  <SectionHeader eyebrow="Pressure" title="Decision Insights" />
                  <MatchInsightsPanel matchId={match.slug} />
                </GlassPanel>
              </div>
            )}
          </div>
        )}

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

        {activeTab === "scorecard" && (
          <div className="space-y-6">
            {currentEngineState?.matchEnded &&
            currentEngineState.winner &&
            currentEngineState.winBy ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center text-white">
                🏆 {currentEngineState.winner} won by {currentEngineState.winBy}
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
                <StatPill label="Batting team" value={inningsData?.battingTeam ?? "Unknown"} tone="green" />
                <StatPill label="Bowling team" value={inningsData?.bowlingTeam ?? "Unknown"} tone="blue" />
                <StatPill label="Score" value={`${inningsData?.runs ?? 0}/${inningsData?.wickets ?? 0}`} tone="neutral" />
                <StatPill label="Over" value={displayOver} tone="amber" />
              </div>
            </GlassPanel>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
              <div className="space-y-6">
                <GlassPanel>
                  <SectionHeader
                    eyebrow="Batting card"
                    title="Batters"
                    action={
                      <span className="text-xs uppercase tracking-[0.18em] text-white/45">
                        {players.length} active records
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
                      players.map(([name, stat]) => {
                        const runs = stat.runs ?? 0;
                        const balls = stat.balls ?? 0;
                        const fours = stat.fours ?? 0;
                        const sixes = stat.sixes ?? 0;
                        const isOut = stat.out ?? false;
                        const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";
                        const isStriker = name === inningsData?.striker;
                        const isNonStriker = name === inningsData?.nonStriker;

                        return (
                          <div
                            key={name}
                            className={cls(
                              "grid grid-cols-[minmax(160px,1.6fr)_0.7fr_0.7fr_0.7fr_0.8fr] items-center gap-3 rounded-2xl border px-3 py-3 text-sm transition",
                              isStriker
                                ? "border-amber-400/20 bg-amber-400/10"
                                : isNonStriker
                                ? "border-sky-400/15 bg-sky-400/10"
                                : "border-white/10 bg-white/[0.04]"
                            )}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {isStriker ? <span className="text-amber-300">★</span> : null}
                                {isNonStriker ? <span className="text-sky-300">○</span> : null}
                                <span className="truncate font-medium text-white">{name}</span>
                              </div>
                              <p className="mt-1 text-xs text-white/55">
                                {isOut ? "out" : "not out"}
                              </p>
                            </div>
                            <span className="text-center font-semibold text-emerald-300">{runs}</span>
                            <span className="text-center text-white">{balls}</span>
                            <span className="text-center text-white/70">{fours}/{sixes}</span>
                            <span className="text-center text-amber-300">{sr}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/60">No batting records available yet.</p>
                    )}
                  </div>
                </GlassPanel>

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
                        const wickets = stat.wickets ?? 0;
                        const economy = overs > 0 ? (runs / overs).toFixed(1) : "0.0";

                        return (
                          <div
                            key={name}
                            className="grid grid-cols-5 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm hover:bg-white/[0.06]"
                          >
                            <span className="truncate text-white">{name}</span>
                            <span className="text-center text-white">{overs}</span>
                            <span className="text-center text-white">{runs}</span>
                            <span className="text-center font-semibold text-rose-300">{wickets}</span>
                            <span className="text-center text-sky-300">{economy}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/60">No bowling records available yet.</p>
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
        <span className="text-white font-medium">
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
                          <span className="font-semibold text-emerald-300">{p.runs} runs</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/60">No partnerships available yet.</p>
                    )}
                  </div>
                </GlassPanel>

                <GlassPanel>
                  <SectionHeader eyebrow="Top batters" title="Player Comparison" />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                    {topPlayers.length ? (
                      topPlayers.map(([name, stat]) => {
                        const runs = stat.runs ?? 0;
                        const balls = stat.balls ?? 0;
                        const sr = balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

                        return (
                          <div
                            key={name}
                            className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                          >
                            <p className="font-medium text-white">{name}</p>
                            <p className="mt-1 text-sm text-white/70">
                              {runs} ({balls})
                            </p>
                            <p className="mt-2 text-sm text-amber-300">SR: {sr}</p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-white/60">No comparison available yet.</p>
                    )}
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        )}

        {activeTab === "admin" && process.env.NODE_ENV === "development" && (
          <div className="space-y-6">
            <GlassPanel>
              <SectionHeader eyebrow="Scoring" title="Admin Scoring Panel" />
              <AdminScoringPanel matchId={match.slug} />
            </GlassPanel>

            <div className="grid gap-6 xl:grid-cols-2">
              <GlassPanel>
                <SectionHeader eyebrow="Broadcast" title="Director Panel" />
                <BroadcastDirectorPanel />
              </GlassPanel>

              <GlassPanel>
                <SectionHeader eyebrow="Broadcast" title="Control Dashboard" />
                <BroadcastControlDashboard />
              </GlassPanel>
            </div>

            <GlassPanel>
              <SectionHeader eyebrow="Simulation" title="Simulation Controls" />
              <div className="flex flex-col gap-4">
                {selectedTeams ? (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                    Teams Selected: {selectedTeams.teamA.name} vs {selectedTeams.teamB.name}
                  </div>
                ) : (
                  <TeamSelector
                    onStart={(teamA, teamB) => {
                      setSelectedTeams({ teamA, teamB });
                    }}
                  />
                )}

                {selectedTeams && !tossData && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-2">
                    <TossPanel
                      teamA={selectedTeams.teamA}
                      teamB={selectedTeams.teamB}
                      onConfirm={(winner, decision) => {
                        setTossData({ winner, decision });
                      }}
                    />
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      const id = match.slug;
                      if (!id || !selectedTeams) return;

                      if (!isRunning) {
                        if (!getMatchState(id)) {
                          initMatch(id);
                        }

                        if (!tossData) {
                          alert("Please complete toss first");
                          return;
                        }

                        const { teamA, teamB } = selectedTeams;
                        const { winner, decision } = tossData;

                        let firstBattingTeam: Team;
                        let firstBowlingTeam: Team;

                        if (decision === "BAT") {
                          firstBattingTeam = winner;
                          firstBowlingTeam = winner.name === teamA.name ? teamB : teamA;
                        } else {
                          firstBowlingTeam = winner;
                          firstBattingTeam = winner.name === teamA.name ? teamB : teamA;
                        }

                        const battingXI = getBattingOrder(firstBattingTeam.squad);
                        const bowlingXI = getBowlingOrder(firstBowlingTeam.squad);

                        startSimulation(
                          {
                            over: 0,
                            ball: 0,
                            totalRuns: 0,
                            wickets: 0,
                            striker: battingXI[0],
                            nonStriker: battingXI[1],
                            bowler: bowlingXI[0],
                            battingOrder: battingXI,
                            bowlingOrder: bowlingXI,
                            currentBowlerIndex: 0,
                            nextBatsmanIndex: 2,
                            phase: "POWERPLAY",
                            teamA: selectedTeams.teamA,
                            teamB: selectedTeams.teamB,
                            tossWinner: winner.name,
                            decision,
                            currentInningsIndex: 0,
                            matchEnded: false,
                            winner: null,
                            winBy: null,
                            battingTeam: firstBattingTeam,
                            bowlingTeam: firstBowlingTeam,
                          },
                          id,
                          speed
                        );

                        setIsRunning(true);
                        setIsPaused(false);
                      } else {
                        stopSimulation();
                        setIsRunning(false);
                        setIsPaused(false);
                      }
                    }}
                    className={cls(
                      "rounded-xl px-4 py-2.5 font-medium text-white transition",
                      isRunning
                        ? "bg-rose-600 hover:bg-rose-500"
                        : "bg-emerald-600 hover:bg-emerald-500"
                    )}
                  >
                    {isRunning ? "⏹ Stop Simulation" : "▶ Start Simulation"}
                  </button>

                  {isRunning ? (
                    <button
                      onClick={() => {
                        if (!isPaused) {
                          pauseSimulation();
                          setIsPaused(true);
                        } else {
                          resumeSimulation();
                          setIsPaused(false);
                        }
                      }}
                      className="rounded-xl bg-amber-500 px-4 py-2.5 font-medium text-slate-950 transition hover:bg-amber-400"
                    >
                      {isPaused ? "▶ Resume" : "⏸ Pause"}
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
                      onClick={() => {
                        setSpeed(option.value);
                        setSimulationSpeed(option.value);
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

      <div className="hidden lg:block">
        <StickyInsightsRail match={match} />
      </div>
    </div>
  );
});

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

  const [match, setMatch] = useState<Match | undefined>();
  const [engineState, setEngineState] = useState<MatchState | undefined>();

  useEffect(() => {
    initTacticalOverlayBridge();
    initCommentaryVoice();
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const id = matchId;

    async function loadMatch() {
      const m = await getMatchBySlug(id);
      setMatch(m);

      if (m?.engineState) {
        hydrateMatchState(id, m.engineState);
        setEngineState(getMatchState(id));
      } else {
        if (!getMatchState(id)) {
          initMatch(id);
        }
        setEngineState(getMatchState(id));
      }
    }

    loadMatch();
  }, [matchId]);

  useEffect(() => {
    if (!matchId) return;
    connectRealtime(matchId);
    return () => {
      disconnectRealtime();
    };
  }, [matchId]);

  useEffect(() => {
    if (!matchId || !match?.externalMatchId) return;

    startLiveMatchIngestor(matchId, match.externalMatchId);
    return () => {
      stopLiveMatchIngestor(matchId);
    };
  }, [matchId, match]);

  useEffect(() => {
    enableBroadcast();
    return () => disableBroadcast();
  }, []);

  useEffect(() => {
    if (!matchId) return;
    const id = matchId;

    const unsubscribe = subscribeMatch(id, () => {
      setEngineState(getMatchState(id));
    });

    return () => {
      unsubscribe();
    };
  }, [matchId]);

  const currentEngineState = useMemo(() => {
    if (!matchId) return undefined;
    return engineState ?? getMatchState(matchId);
  }, [engineState, matchId]);

  const currentInnings = useMemo(() => {
    if (!currentEngineState) return undefined;
    return currentEngineState.innings?.[currentEngineState.currentInningsIndex ?? 0];
  }, [currentEngineState]);

  const inningsIndex = currentEngineState?.currentInningsIndex ?? 0;

const battingStats = getBattingStats(matchId!, inningsIndex) as Record<
  string,
  { runs?: number; balls?: number }
>;

const bowlingStats = getBowlingStats(matchId!, inningsIndex) as Record<
  string,
  { overs?: number; runs?: number; wickets?: number }
>;
  // 🔥 CURRENT PLAYERS
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

// 🔥 CURRENT BOWLER (safe fallback)
let bowler;

const bowlerName = currentInnings?.currentBowler;

if (bowlerName) {
  const stats = bowlingStats?.[bowlerName];

  bowler = {
    name: bowlerName,
    overs: stats?.overs ?? 0,
    runs: stats?.runs ?? 0,
    wickets: stats?.wickets ?? 0,
  };
}

// 🔥 LAST OVER BALLS (YOU ALREADY HAVE STRUCTURE)
let lastOverBalls: string[] = [];

if (currentInnings?.overs) {
  const overKeys = Object.keys(currentInnings.overs);
  const lastKey = overKeys[overKeys.length - 1];

  const balls = currentInnings.overs[Number(lastKey)] || [];

  lastOverBalls = balls.map((b: { runs?: number; outcome?: string }) => {
    if (b.outcome === "WICKET") return "W";
    if (b.runs === 6) return "6";
    if (b.runs === 4) return "4";
    return String(b.runs ?? 0);
  });
}

  const displayOver = formatOverDisplay(currentInnings?.overs);

  const innings1 = currentEngineState?.innings?.[0];
  const innings2 = currentEngineState?.innings?.[1];

  // 🧠 TARGET + RRR LOGIC
let target = 0;
let runsNeeded = 0;
let ballsLeft = 0;
let rrr = 0;

if (innings1 && innings2) {
  target = (innings1.runs ?? 0) + 1;

  const currentRuns = innings2.runs ?? 0;
  runsNeeded = target - currentRuns;

  const totalOvers = 20; // T20 (change if dynamic)
  const ballsBowled = Math.floor(displayOver) * 6 + Math.round((displayOver % 1) * 10);

  ballsLeft = totalOvers * 6 - ballsBowled;

  if (ballsLeft > 0) {
    rrr = (runsNeeded / ballsLeft) * 6;
  }
}

let crr = 0;

if (currentInnings) {
  const runs = currentInnings.runs ?? 0;

  const ballsBowled =
    Math.floor(displayOver) * 6 +
    Math.round((displayOver % 1) * 10);

  if (ballsBowled > 0) {
    crr = (runs / ballsBowled) * 6;
  }
}

let winProbability = 50;

if (innings2 && !currentEngineState.matchEnded) {
  if (rrr > 0) {
    winProbability = Math.max(
      0,
      Math.min(100, 100 - rrr * 5)
    );
  }
}

  return (
  <PageMotion>
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_24%),linear-gradient(180deg,#020617_0%,#071120_35%,#0b1220_65%,#020617_100%)]">
      <MatchProvider value={{ matchId: matchId!, state: currentEngineState! }}>
        {!currentEngineState ? (
          <div className="p-10 text-center text-white">
            Loading match engine...
          </div>
        ) : (
          <main className="relative overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8">

              <div className="mb-6">
                {currentInnings ? (
                  <div className="space-y-4">

                    <GlassPanel>
                      <div className="flex flex-col gap-5">

                        {/* TOP HEADER */}
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300/80">
                              CricSmart Match Center
                            </p>

                            <h1 className="text-2xl font-semibold text-white md:text-3xl">
                              {currentEngineState.teamA?.name ?? match?.team1 ?? "Team A"} vs{" "}
                              {currentEngineState.teamB?.name ?? match?.team2 ?? "Team B"}
                            </h1>

                            <p className="text-sm text-white/60">
                              Live simulation, analytics, commentary, and innings-aware scorecard.
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href="/matches"
                              className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                            >
                              ← Back to matches
                            </Link>
                          </div>
                        </div>

                        {/* MAIN SCORE */}
                        <MatchHeader
                          team1={currentEngineState.teamA?.name ?? match?.team1 ?? "Team A"}
                          team2={currentEngineState.teamB?.name ?? match?.team2 ?? "Team B"}
                          runs={currentInnings?.runs ?? 0}
                          wickets={currentInnings?.wickets ?? 0}
                          over={displayOver}
                          ball={0}

                          striker={striker}
  nonStriker={nonStriker}
  bowler={bowler}
  lastOverBalls={lastOverBalls}
                        />

                        {/* 🔥 STATS + TARGET + RRR */}
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">

                          {/* ✅ CORRECT TEAM MAPPING */}

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

                          {/* 🔥 TARGET */}
                          {innings2 && !currentEngineState.matchEnded && (
                            <StatPill
                              label="Target"
                              value={target}
                              tone="neutral"
                            />
                          )}

                          {/* 🔥 NEED */}
                          {innings2 && !currentEngineState.matchEnded && (
                            <StatPill
                              label="Need"
                              value={`${runsNeeded} in ${ballsLeft}`}
                              tone="amber"
                            />
                          )}

                          {/* 🔥 RRR */}
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
{/* 🔥 WIN % */}
{innings2 && !currentEngineState.matchEnded && (
  <StatPill
    label="Win %"
    value={`${winProbability.toFixed(0)}%`}
    tone="green"
  />
)}
{/* 🔥 PRESSURE */}
{innings2 && !currentEngineState.matchEnded && (
  <StatPill
    label="Pressure"
    value={
      rrr > crr
        ? "High"
        : rrr > crr * 0.8
        ? "Medium"
        : "Low"
    }
    tone={
      rrr > crr
        ? "red"
        : rrr > crr * 0.8
        ? "amber"
        : "green"
    }
  />
)}

                          {/* STATUS */}
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                              Status
                            </p>
                            <div className="mt-2">
                              <LiveMatchStatus />
                            </div>
                          </div>

                        </div>
                        {/* ✅ ADD THIS HERE (EXACT PLACE) */}
{currentEngineState.matchEnded &&
  currentEngineState.winner && (
    <div className="mt-3 text-center text-sm text-white border-t border-white/10 pt-3">
      🏆 {currentEngineState.winner} won by {currentEngineState.winBy}
{ballsLeft > 0 ? ` (${ballsLeft} balls left)` : ""}
    </div>
)}

                      </div>
                    </GlassPanel>

                  </div>
                ) : null}
              </div>

              {match ? <TabsArea match={match} /> : null}

            </div>
          </main>
        )}
      </MatchProvider>
    </div>
  </PageMotion>
);
}