"use client";

import React, { useEffect, useMemo, useState, use } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { hydrateMatchState, MatchState } from "@/services/matchEngine";
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
import { connectRealtime, disconnectRealtime } from "@/services/realtime/connectRealtime";
import type { MatchReconnectHealth } from "@/services/match/matchRegistry";
import type { LiveSessionState } from "@/types/liveSession";
import { initTacticalOverlayBridge } from "@/services/tacticalOverlayBridge";
import WagonWheel from "@/components/analytics/WagonWheel";
import { calculateWinProbability } from "@/services/analytics/calculateWinProbability";
import { setMatchMeta } from "@/store/matchStore";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";
import AnimatedScore from "@/components/ui/AnimatedScore";
import ConnectionStatus from "@/components/ui/ConnectionStatus";
import {
  getMomentumData,
  getWinProbabilityData,
  useReplayEvents,
} from "@/hooks/useReplayEvents";
import { dedupeReplayEvents } from "@/services/replay/replayEventUtils";
import { GraphErrorBoundary } from "@/components/match/GraphErrorBoundary";

// ─────────────────────────────────────────────
// Types (unchanged)
// ─────────────────────────────────────────────

type AnalysisFilter = "ALL" | "BATTING" | "BOWLING" | "PRESSURE";
type SquadRole = "BAT" | "BOWL" | "AR" | "WK";
type SquadPlayer = { name: string; role: SquadRole };
type EngineStateWithHostedMatchId = MatchState & { hostedMatchId?: string | null };
type MainTab = "overview" | "live" | "analysis" | "overs" | "scorecard" | "squad" | "admin";

const AUTO_RECONNECT_SUBSCRIBER_ID = "match-detail-page-auto";

type PlayerStat = { runs: number; balls: number; fours: number; sixes: number; out: boolean };
type BowlerStat = { overs?: number; runs?: number; wickets?: number };
type BroadcastInsight = {
  type: "KEY_MOMENT" | "PARTNERSHIP_ALERT" | "MOMENTUM_SHIFT" | "PHASE_UPDATE" | "COLLAPSE_ALERT";
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};
type MatchSessionMeta = {
  type?: "LIVE" | "SIMULATION";
  sessionState?: LiveSessionState;
  reconnectHealth?: MatchReconnectHealth;
};

// ─────────────────────────────────────────────
// Helpers (unchanged)
// ─────────────────────────────────────────────

function cls(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatOverDisplay(overs?: Record<string, unknown>) {
  if (!overs) return 0;
  const keys = Object.keys(overs).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!keys.length) return 0;
  const lastOverNumber = keys[keys.length - 1];
  const balls = Array.isArray(overs[lastOverNumber]) ? (overs[lastOverNumber] as unknown[]).length : 0;
  if (balls >= 6) return lastOverNumber + 1;
  return Number(`${lastOverNumber}.${balls}`);
}

function resolveHostedMatchId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function buildFallbackSimulationXI(teamName: string): SquadPlayer[] {
  const roles: SquadRole[] = ["BAT","BAT","BAT","WK","BAT","AR","AR","BOWL","BOWL","BOWL","BOWL"];
  return roles.map((role, index) => ({ name: `${teamName} Player ${index + 1}`, role }));
}

function buildSimulationPlayingXI(teamName: string): SquadPlayer[] {
  const knownTeam = teams.find((team) => team.name === teamName);
  if (knownTeam?.squad?.length) return knownTeam.squad.slice(0, 11).map((player) => ({ name: player.name, role: player.role }));
  return buildFallbackSimulationXI(teamName);
}

// ─────────────────────────────────────────────
// UPGRADED: Global styles injected once
// ─────────────────────────────────────────────

const MATCH_PAGE_STYLES = `
  /* ── tokens ── */
  .mdp-root {
    --mdp-cyan: #00E5FF;
    --mdp-green: #00FF87;
    --mdp-purple: #7C3AED;
    --mdp-amber: #F59E0B;
    --mdp-red: #EF4444;
    --mdp-teal: #06B6D4;
    --mdp-bg: #040A14;
    --mdp-surface: rgba(255,255,255,0.03);
    --mdp-surface-2: rgba(255,255,255,0.05);
    --mdp-border: rgba(255,255,255,0.07);
    --mdp-border-med: rgba(255,255,255,0.12);
    --mdp-text-1: #F0F4F8;
    --mdp-text-2: #94A3B8;
    --mdp-text-3: #475569;
  }

  /* ── animated live dot ── */
  @keyframes mdp-pulse { 0% { transform:scale(1); opacity:.5 } 100% { transform:scale(2.5); opacity:0 } }
  .mdp-live-dot { display:inline-block; position:relative; width:8px; height:8px; flex-shrink:0 }
  .mdp-live-dot::before { content:''; position:absolute; inset:0; border-radius:50%; background:var(--mdp-red); animation:mdp-pulse 1.4s ease-out infinite; opacity:.5 }
  .mdp-live-dot::after  { content:''; position:absolute; inset:1px; border-radius:50%; background:var(--mdp-red) }
  .mdp-live-dot.amber::before, .mdp-live-dot.amber::after { background:var(--mdp-amber) }
  .mdp-live-dot.green::before,  .mdp-live-dot.green::after  { background:var(--mdp-green) }

  /* ── hero banner ── */
  .mdp-hero {
    background: linear-gradient(135deg, rgba(0,229,255,0.08) 0%, rgba(124,58,237,0.06) 50%, rgba(0,255,135,0.04) 100%);
    border: 1px solid rgba(0,229,255,0.12);
    border-radius: 16px;
    padding: 20px 24px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(8px);
  }
  .mdp-hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 220px; height: 220px;
    background: radial-gradient(circle, rgba(0,229,255,0.08), transparent 65%);
    pointer-events: none;
  }
  .mdp-hero-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .18em;
    color: var(--mdp-cyan); text-transform: uppercase; margin-bottom: 6px;
    display: flex; align-items: center; gap: 7px;
  }
  .mdp-hero-title {
    font-size: clamp(20px, 2.5vw, 28px);
    font-weight: 800; letter-spacing: -.025em;
    color: var(--mdp-text-1); margin: 0 0 4px;
    font-family: "Space Grotesk", "DM Sans", sans-serif;
  }
  .mdp-hero-sub { font-size: 12px; color: var(--mdp-text-3); }

  /* ── big score display ── */
  .mdp-score-big {
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 900; letter-spacing: -.04em;
    color: var(--mdp-text-1); line-height: 1;
  }
  .mdp-score-over { font-size: 13px; color: var(--mdp-text-3); margin-top: 3px; font-family: monospace; }

  /* ── stat pills ── */
  .mdp-pill {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px;
    padding: 10px 14px;
    min-height: 64px;
    display: flex; flex-direction: column; justify-content: space-between;
    transition: border-color .2s, box-shadow .2s;
  }
  .mdp-pill:hover { border-color: rgba(0,229,255,0.25); box-shadow: 0 0 12px rgba(0,229,255,0.08); }
  .mdp-pill-label {
    font-size: 10px; font-weight: 700; letter-spacing: .14em;
    text-transform: uppercase; color: var(--mdp-text-3);
  }
  .mdp-pill-value {
    font-size: 14px; font-weight: 700; color: var(--mdp-text-1); margin-top: 6px;
  }
  .mdp-pill.cyan  { border-color: rgba(0,229,255,0.15); }
  .mdp-pill.green { border-color: rgba(0,255,135,0.15); }
  .mdp-pill.amber { border-color: rgba(245,158,11,0.15); }
  .mdp-pill.red   { border-color: rgba(239,68,68,0.15); }
  .mdp-pill.cyan  .mdp-pill-value { color: var(--mdp-cyan); }
  .mdp-pill.green .mdp-pill-value { color: var(--mdp-green); }
  .mdp-pill.amber .mdp-pill-value { color: var(--mdp-amber); }
  .mdp-pill.red   .mdp-pill-value { color: var(--mdp-red); }

  /* ── last over balls ── */
  .mdp-ball {
    width: 32px; height: 32px; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--mdp-text-1); flex-shrink: 0;
  }
  .mdp-ball.four   { background: rgba(0,229,255,0.15); border-color: rgba(0,229,255,0.35); color: var(--mdp-cyan); }
  .mdp-ball.six    { background: rgba(0,255,135,0.15); border-color: rgba(0,255,135,0.35); color: var(--mdp-green); }
  .mdp-ball.wicket { background: rgba(239,68,68,0.15); border-color: rgba(239,68,68,0.35); color: var(--mdp-red); }
  .mdp-ball.wide   { background: rgba(245,158,11,0.1);  border-color: rgba(245,158,11,0.25); color: var(--mdp-amber); }
  .mdp-ball.noball { background: rgba(245,158,11,0.1);  border-color: rgba(245,158,11,0.25); color: var(--mdp-amber); }

  /* ── tab bar ── */
  .mdp-tabbar {
    display: flex; gap: 0;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    overflow-x: auto;
    position: sticky; top: 24px; z-index: 20;
    background: rgba(4,10,20,0.92); backdrop-filter: blur(16px) saturate(1.2);
    border-radius: 0;
    padding: 0 2px;
  }
  .mdp-tabbar::-webkit-scrollbar { display: none; }
  .mdp-tab {
    padding: 10px 16px; font-size: 12px; font-weight: 600;
    letter-spacing: .05em; text-transform: capitalize;
    color: var(--mdp-text-3); white-space: nowrap;
    border: none; background: none; cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: color .2s, border-color .2s;
  }
  .mdp-tab:hover  { color: var(--mdp-text-2); }
  .mdp-tab.active { color: var(--mdp-cyan); border-bottom-color: var(--mdp-cyan); font-weight: 700; }

  /* ── section header ── */
  .mdp-sec-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: rgba(0,229,255,0.7); margin-bottom: 4px;
  }
  .mdp-sec-title { font-size: 16px; font-weight: 700; color: var(--mdp-text-1); }

  /* ── panel card ── */
  .mdp-card {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px; padding: 18px 20px;
    transition: border-color .2s, box-shadow .2s;
  }
  .mdp-card:hover { border-color: rgba(0,229,255,0.15); box-shadow: 0 0 15px rgba(0,229,255,0.06); }

  /* ── right rail ── */
  .mdp-rail-label {
    font-size: 9px; font-weight: 700; letter-spacing: .18em;
    text-transform: uppercase; color: var(--mdp-text-3); margin-bottom: 3px;
  }
  .mdp-rail-value {
    font-size: 14px; font-weight: 700; color: var(--mdp-text-1);
    padding: 8px 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
  }
  .mdp-rail-value.cyan  { color: var(--mdp-cyan); border-color: rgba(0,229,255,0.15); background: rgba(0,229,255,0.05); }
  .mdp-rail-value.green { color: var(--mdp-green); border-color: rgba(0,255,135,0.15); background: rgba(0,255,135,0.05); }
  .mdp-rail-value.amber { color: var(--mdp-amber); border-color: rgba(245,158,11,0.15); background: rgba(245,158,11,0.05); }

  /* ── batter row ── */
  .mdp-batter-row {
    display: grid;
    grid-template-columns: minmax(140px,1.6fr) .7fr .7fr .7fr .8fr;
    gap: 10px; align-items: center;
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.07);
    background: rgba(255,255,255,0.025);
    font-size: 13px; transition: background .2s;
  }
  .mdp-batter-row:hover { background: rgba(255,255,255,0.045); }
  .mdp-batter-row.striker  { border-color: rgba(245,158,11,0.25); background: rgba(245,158,11,0.07); }
  .mdp-batter-row.nonstriker { border-color: rgba(0,229,255,0.2); background: rgba(0,229,255,0.05); }

  /* ── bowler row ── */
  .mdp-bowler-row {
    display: grid; grid-template-columns: 1fr repeat(4, .7fr);
    gap: 10px; align-items: center;
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    font-size: 13px; transition: background .2s;
  }
  .mdp-bowler-row:hover { background: rgba(255,255,255,0.04); }

  /* ── innings selector button ── */
  .mdp-innings-btn {
    padding: 7px 18px; border-radius: 8px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .2s;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: var(--mdp-text-2);
  }
  .mdp-innings-btn.active {
    background: linear-gradient(135deg, var(--mdp-cyan), #0077FF);
    border-color: transparent; color: #040A14;
  }

  /* ── squad card ── */
  .mdp-squad-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 14px; border-radius: 9px;
    border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.025);
    font-size: 13px; transition: background .2s;
  }
  .mdp-squad-row:hover { background: rgba(255,255,255,0.05); }
  .mdp-role-badge {
    font-size: 10px; font-weight: 700; letter-spacing: .08em;
    padding: 2px 7px; border-radius: 4px;
  }
  .mdp-role-badge.BAT  { background: rgba(0,255,135,0.1); color: var(--mdp-green); }
  .mdp-role-badge.BOWL { background: rgba(239,68,68,0.1); color: var(--mdp-red); }
  .mdp-role-badge.AR   { background: rgba(0,229,255,0.1); color: var(--mdp-cyan); }
  .mdp-role-badge.WK   { background: rgba(245,158,11,0.1); color: var(--mdp-amber); }

  /* ── admin panel upgrades ── */
  .mdp-admin-btn {
    padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all .2s; border: none;
    letter-spacing: .03em;
  }
  .mdp-admin-btn.start  { background: linear-gradient(135deg,#00E5FF,#0077FF); color:#040A14; }
  .mdp-admin-btn.start:hover  { box-shadow: 0 0 28px rgba(0,229,255,0.3); transform: translateY(-1px); }
  .mdp-admin-btn.pause  { background: rgba(245,158,11,0.85); color:#040A14; }
  .mdp-admin-btn.stop   { background: rgba(239,68,68,0.8); color:#fff; }
  .mdp-admin-btn:disabled { opacity:.45; cursor:not-allowed; transform:none !important; box-shadow:none !important; }
  .mdp-speed-btn {
    padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all .2s;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04); color: var(--mdp-text-2);
  }
  .mdp-speed-btn.active {
    border-color: rgba(0,229,255,0.3);
    background: rgba(0,229,255,0.1);
    color: var(--mdp-cyan);
  }

  /* ── analysis win prob row ── */
  .mdp-prob-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .mdp-prob-cell {
    padding: 12px 14px; border-radius: 10px; border: 1px solid transparent;
  }
  .mdp-prob-cell .label { font-size: 10px; text-transform:uppercase; letter-spacing:.12em; margin-bottom:6px; }
  .mdp-prob-cell .val   { font-size: 18px; font-weight: 800; }
  .mdp-prob-cell.batting { background: rgba(0,255,135,0.07); border-color: rgba(0,255,135,0.2); }
  .mdp-prob-cell.batting .label { color: rgba(0,255,135,0.7); }
  .mdp-prob-cell.batting .val   { color: var(--mdp-green); }
  .mdp-prob-cell.bowling { background: rgba(239,68,68,0.07); border-color: rgba(239,68,68,0.2); }
  .mdp-prob-cell.bowling .label { color: rgba(239,68,68,0.8); }
  .mdp-prob-cell.bowling .val   { color: var(--mdp-red); }
  .mdp-prob-cell.pressure { background: rgba(245,158,11,0.07); border-color: rgba(245,158,11,0.2); }
  .mdp-prob-cell.pressure .label { color: rgba(245,158,11,0.8); }
  .mdp-prob-cell.pressure .val   { color: var(--mdp-amber); }

  /* ── live commentary upgrade ── */
  .mdp-live-split { display: grid; grid-template-columns: minmax(0,1fr) 290px; gap: 14px; }
  @media(max-width:1024px) { .mdp-live-split { grid-template-columns:1fr; } }

  /* ── overview control bar ── */
  .mdp-ctrl-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 18px; border-radius:9px; font-size:13px; font-weight:700;
    cursor:pointer; transition:all .2s; border:none;
  }
  .mdp-ctrl-btn.primary { background:linear-gradient(135deg,#00E5FF,#0077FF); color:#040A14; }
  .mdp-ctrl-btn.primary:hover { box-shadow:0 0 24px rgba(0,229,255,0.25); transform:translateY(-1px); }
  .mdp-ctrl-btn.ghost { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1); color:var(--mdp-text-2); }
  .mdp-ctrl-btn.ghost:hover { border-color:rgba(0,229,255,0.3); color:var(--mdp-cyan); }

  /* ── replay toggle ── */
  .mdp-replay-btn {
    padding:6px 14px; border-radius:8px; font-size:12px; font-weight:600;
    background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.1);
    color:var(--mdp-text-2); cursor:pointer; transition:all .2s;
  }
  .mdp-replay-btn:hover { border-color:rgba(0,229,255,0.3); color:var(--mdp-cyan); }

  /* ── section divider ── */
  .mdp-divider { height:1px; background:rgba(255,255,255,0.06); margin:0; }

  /* ── scrollbar ── */
  .mdp-root ::-webkit-scrollbar { width:4px; height:4px; }
  .mdp-root ::-webkit-scrollbar-track { background:transparent; }
  .mdp-root ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
`;

// ─────────────────────────────────────────────
// UPGRADED: StatPill
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
  const toneClass = tone === "green" ? "green" : tone === "blue" ? "cyan" : tone === "amber" ? "amber" : tone === "red" ? "red" : "";
  return (
    <div className={`mdp-pill ${toneClass}`}>
      <p className="mdp-pill-label">{label}</p>
      <div className="mdp-pill-value">{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UPGRADED: SectionHeader
// ─────────────────────────────────────────────

function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
      <div>
        {eyebrow && <p className="mdp-sec-eyebrow">{eyebrow}</p>}
        <h3 className="mdp-sec-title">{title}</h3>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// UPGRADED: StickyInsightsRail
// ─────────────────────────────────────────────

function StickyInsightsRail({ match, sessionMeta }: { match: Match; sessionMeta?: MatchSessionMeta | null }) {
  const score = useScore(match.slug);
  const batters = useCurrentBatters(match.slug);
  const currentInningsIndex = useMatchSelector(match.slug, (state) => state.currentInningsIndex);
  const teams = useMatchSelector(
    match.slug,
    (state) => {
      if (!state?.innings) return undefined;
      const innings = state.innings[state.currentInningsIndex ?? 0];
      return { battingTeam: innings?.battingTeam ?? "TBD", bowlingTeam: innings?.bowlingTeam ?? "TBD" };
    },
    shallowEqual
  );
  const overs = useCurrentInningsOvers(match.slug);

  const overKeys = overs ? Object.keys(overs).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b) : [];
  const lastOverKey = overKeys.length ? overKeys[overKeys.length - 1] : undefined;
  const lastOverBalls = lastOverKey !== undefined && Array.isArray(overs?.[lastOverKey]) ? overs[lastOverKey].slice(0, 6) : [];

  const railItems = [
    { label: "Current Innings", value: `Innings ${(currentInningsIndex ?? 0) + 1}`, color: "" },
    { label: "Batting", value: teams?.battingTeam ?? "TBD", color: "green" },
    { label: "Bowling", value: teams?.bowlingTeam ?? "TBD", color: "cyan" },
    { label: "Score", value: <AnimatedScore value={`${score.runs}/${score.wickets}`} />, color: "" },
    { label: "Over", value: score.overs, color: "amber" },
    { label: "Striker", value: batters?.striker || "—", color: "green" },
    { label: "Non-Striker", value: batters?.nonStriker || "—", color: "cyan" },
    { label: "Bowler", value: "—", color: "amber" },
  ];

  return (
    <div style={{ position: "sticky", top: 80 }}>
      {/* Match Snapshot */}
      <div className="mdp-card" style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div className="mdp-live-dot" />
          <span className="text-[11px] font-bold tracking-[.1em] text-[var(--mdp-cyan)] uppercase">Live Pulse</span>
        </div>
        <p className="mdp-sec-eyebrow" style={{ marginBottom: 10 }}>Match Snapshot</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {railItems.map((item, idx) => (
            <div key={`rail-${item.label || idx}`}>
              <div className="mdp-rail-label">{item.label}</div>
              <div className={`mdp-rail-value ${item.color}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Over */}
      <div className="mdp-card" style={{ marginBottom: 12 }}>
        <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Recent Action</p>
        <p className="mdp-sec-title" style={{ marginBottom: 12 }}>Current Over</p>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {lastOverBalls.length ? (
            lastOverBalls.map((ball: { runs?: number; label?: string; outcome?: string; extraType?: string }, index: number) => {
              const label = ball?.runs ?? ball?.label ?? ball?.outcome ?? "•";
              const ballClass = ball?.outcome === "WICKET" ? "wicket" : String(label) === "6" ? "six" : String(label) === "4" ? "four" : ball?.extraType === "WD" ? "wide" : ball?.extraType === "NB" ? "noball" : "";
              return <span key={index} className={`mdp-ball ${ballClass}`}>{String(label)}</span>;
            })
          ) : (
            <p className="text-xs text-var(--mdp-text-3)">No balls yet</p>
          )}
        </div>
      </div>

      {/* Control Deck */}
      <div className="mdp-card">
        <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Quick Access</p>
        <p className="mdp-sec-title" style={{ marginBottom: 12 }}>Control Deck</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <LiveMatchStatus matchId={match.slug} sessionState={sessionMeta?.sessionState} reconnectHealth={sessionMeta?.reconnectHealth} />
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px" }}>
            <p className="text-sm font-bold text-white mb-1">Fixture</p>
            <p className="text-sm text-var(--mdp-text-2)">
              {match.team1} <span style={{ color: "var(--mdp-text-3)" }}>vs</span> {match.team2}
            </p>
            <p className="text-xs text-[var(--mdp-text-3)] mt-1 font-mono">
              Over: {match.currentOver ?? 0}.{match.currentBall ?? 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// UPGRADED: TabsArea
// ─────────────────────────────────────────────

function TabsArea({
  match, analytics, insights, sessionMeta, hostedMatchId,
}: {
  match: Match;
  analytics: { winProbability: { over: number; value: number }[]; momentum: { over: number; score: number }[] };
  insights: BroadcastInsight[];
  sessionMeta?: MatchSessionMeta | null;
  hostedMatchId?: string | null;
}) {
  const isAdmin = true;
  const { state: currentEngineState } = useMatch();
  const [, forceMatchStoreUpdate] = useState(0);
  const [matchMeta, setLocalMatchMeta] = useState(() => getMatchMeta(match.slug));
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<MainTab>("overview");

  useEffect(() => {
    const tab = searchParams.get("tab") as MainTab;
    if (!tab) return;
    setTimeout(() => setActiveTab(tab), 0);
  }, [searchParams]);

  const [showExpandedAnalytics, setShowExpandedAnalytics] = useState(false);
  const [tossData, setTossData] = useState<{ winner: Team; decision: "BAT" | "BOWL" } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1500);
  const [showReplayTimeline, setShowReplayTimeline] = useState(false);

  const currentHostedMatchId =
    resolveHostedMatchId((currentEngineState as EngineStateWithHostedMatchId | undefined)?.hostedMatchId) ??
    resolveHostedMatchId(hostedMatchId) ??
    resolveHostedMatchId(matchMeta?.hostedMatchId);
  const isSimulationMatch = !currentHostedMatchId;

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
  const safeWinProbabilityEvents = Array.isArray(analytics?.winProbability) ? analytics.winProbability : [];
  const safeMomentumData = Array.isArray(analytics?.momentum) ? analytics.momentum : [];
  const safeInnings = Array.isArray(currentEngineState?.innings) ? currentEngineState.innings : [];

  const winProbabilityData = useMemo(() => calculateWinProbability(safeWinProbabilityEvents), [safeWinProbabilityEvents]);
  const latestWinPoint = winProbabilityData.length ? winProbabilityData[winProbabilityData.length - 1] : null;

  useEffect(() => {
    if (!hasLiveMatchState) return;
    setTimeout(() => { setIsRunning(true); setStartError(null); }, 0);
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[40, 200, 150].map((h) => (
          <div key={h} style={{ height: h, background: "rgba(255,255,255,0.04)", borderRadius: 12, animation: "pulse 1.5s ease infinite" }} />
        ))}
      </div>
    );
  }

  const inningsIndex = selectedInnings !== null ? selectedInnings : currentEngineState?.currentInningsIndex ?? 0;
  const inningsData = currentEngineState?.innings?.[inningsIndex];
  const displayOver = inningsData ? `${inningsData.over}.${inningsData.ball}` : "0.0";

  const batting = getBattingStats(match.slug, inningsIndex) as Record<string, PlayerStat>;
  const bowling = getBowlingStats(match.slug, inningsIndex) as Record<string, BowlerStat>;
  const extras = getExtras(match.slug, inningsIndex);
  const wickets = (getFallOfWickets(match.slug, inningsIndex) ?? []).filter(Boolean);
  const battingRecords = Array.isArray(inningsData?.battingRecords) ? inningsData.battingRecords : [];

  type PlayerRow = { name: string; runs: number; balls: number; fours: number; sixes: number; out: boolean; isStriker: boolean; isNonStriker: boolean };

  const strikerName = typeof inningsData?.striker === "string" ? inningsData.striker.trim() : "";
  const nonStrikerName = typeof inningsData?.nonStriker === "string" ? inningsData.nonStriker.trim() : "";
  const playerMap = new Map<string, PlayerRow>();

  const ensurePlayerRow = (name: string): PlayerRow => {
    const trimmedName = name.trim();
    const existing = playerMap.get(trimmedName);
    if (existing) return existing;
    const newRow: PlayerRow = { name: trimmedName, runs: 0, balls: 0, fours: 0, sixes: 0, out: false, isStriker: false, isNonStriker: false };
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
  const activePlayers = allPlayers.filter((p) => p.isStriker || p.isNonStriker);
  const inactivePlayers = allPlayers.filter((p) => !p.isStriker && !p.isNonStriker);
  const players: PlayerRow[] = activePlayers.length > 0 ? [...activePlayers, ...inactivePlayers] : allPlayers;
  const topPlayers = [...allPlayers].sort((a, b) => { if (b.runs !== a.runs) return b.runs - a.runs; if (a.out !== b.out) return Number(a.out) - Number(b.out); return a.name.localeCompare(b.name); }).slice(0, 2);
  const partnerships = strikerName && nonStrikerName ? [{ players: `${strikerName} & ${nonStrikerName}`, runs: 0 }] : [];

  const tabs: MainTab[] = ["overview", "live", "analysis", "overs", "scorecard", "squad", "admin"];
  const teamASquad = currentEngineState?.teamA?.squad ?? [];
  const teamBSquad = currentEngineState?.teamB?.squad ?? [];

  const summaryCards = [
    { label: "Batting", value: inningsData?.battingTeam ?? "TBD", tone: "green" as const },
    { label: "Bowling", value: inningsData?.bowlingTeam ?? "TBD", tone: "blue" as const },
    { label: "Score", value: `${inningsData?.runs ?? 0}/${inningsData?.wickets ?? 0}`, tone: "neutral" as const },
    { label: "Over", value: displayOver, tone: "amber" as const },
  ];

  const overviewBattingTeam = inningsData?.battingTeam ?? currentEngineState?.innings?.[currentEngineState.currentInningsIndex]?.battingTeam ?? matchMeta?.teamA?.name ?? match.team1;
  const overviewBowlingTeam = inningsData?.bowlingTeam ?? currentEngineState?.innings?.[currentEngineState.currentInningsIndex]?.bowlingTeam ?? matchMeta?.teamB?.name ?? match.team2;
  const inningsRunRate = inningsData && (inningsData.over > 0 || inningsData.ball > 0) ? (inningsData.runs / (inningsData.over + inningsData.ball / 6)).toFixed(2) : "0.00";

  return (
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: activeTab === "live" ? "1fr" : "minmax(0,1fr) 280px" }}>
      <div style={{ minWidth: 0 }}>

        {/* ── UPGRADED Tab Bar ── */}
        <div className="mdp-tabbar" style={{ marginBottom: 16 }}>
          {tabs.map((tab) => (
            <button key={tab} className={`mdp-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {/* ════════════════ OVERVIEW TAB ════════════════ */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="mdp-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <p className="mdp-sec-eyebrow">Match Center</p>
                  <h3 className="mdp-sec-title">Overview</h3>
                </div>
                <LiveMatchStatus matchId={match.slug} sessionState={sessionMeta?.sessionState} reconnectHealth={sessionMeta?.reconnectHealth} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                {summaryCards.map((item) => <StatPill key={item.label} label={item.label} value={item.value} tone={item.tone} />)}
              </div>
            </div>

            <div className="mdp-card">
              <SectionHeader eyebrow="Control" title="Match Controls" />
              {sessionMeta?.type === "LIVE" ? (
                <div className="text-sm text-[var(--brand)]/80 bg-[var(--brand)]/5 border border-[var(--brand)]/15 rounded-[10px] px-3.5 py-3">
                  Live sessions connect automatically. Simulation controls are hidden for provider-driven matches.
                </div>
              ) : (
                <MatchControlPanel matchId={match.slug} />
              )}
            </div>

            <div className="mdp-card">
              <SectionHeader eyebrow="Narrative" title="Match Story" />
              <MatchStory matchId={match.slug} />
            </div>

            <div className="mdp-card">
              <GraphErrorBoundary label="Match Graphs">
                <MatchGraphExplorer
                  currentBattingTeam={overviewBattingTeam}
                  currentBowlingTeam={overviewBowlingTeam}
                  currentOver={displayOver}
                  currentRunRate={inningsRunRate}
                  innings={safeInnings}
                  momentumData={safeMomentumData}
                  winProbabilityData={winProbabilityData}
                />
              </GraphErrorBoundary>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div className="mdp-card">
                <SectionHeader eyebrow="Stand" title="Partnership Watch" />
                <PartnershipPanel matchId={match.slug} />
              </div>
              <div className="mdp-card">
                <SectionHeader eyebrow="Moments" title="Highlights" />
                <HighlightTimeline matchId={match.slug} />
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ LIVE TAB ════════════════ */}
        {activeTab === "live" && (
          <div className="mdp-live-split">
            <div className="mdp-card">
              <SectionHeader eyebrow="Ball by ball" title="Live Commentary" />
              {sessionMeta?.type === "LIVE" && (
                <div className="text-xs text-[var(--brand)]/80 bg-[var(--brand)]/6 border border-[var(--brand)]/18 rounded-[9px] px-3 py-2 mb-3">
                  Score updates every 60s. Ball-by-ball feed may be limited on free CricAPI tier.
                </div>
              )}
              <CommentaryPanel matchId={match.slug} insights={insights} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="mdp-card">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div className="mdp-live-dot" />
                  <span className="text-[11px] font-bold tracking-[.1em] text-[var(--mdp-cyan)] uppercase">Live Pulse</span>
                </div>
                <p className="mdp-sec-title" style={{ marginBottom: 10 }}>Session Status</p>
                <LiveMatchStatus matchId={match.slug} sessionState={sessionMeta?.sessionState} reconnectHealth={sessionMeta?.reconnectHealth} />
              </div>

              <div className="mdp-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showReplayTimeline ? 12 : 0 }}>
                  <div>
                    <p className="mdp-sec-eyebrow" style={{ marginBottom: 2 }}>Replay</p>
                    <p className="text-xs text-var(--mdp-text-3)">Open compact replay controls only when needed.</p>
                  </div>
                  <button className="mdp-replay-btn" onClick={() => setShowReplayTimeline((p) => !p)}>
                    {showReplayTimeline ? "Hide Replay" : "Open Replay"}
                  </button>
                </div>
                {showReplayTimeline && <div style={{ marginTop: 10 }}><ReplaySlider matchId={match.slug} /></div>}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ ANALYSIS TAB ════════════════ */}
        {activeTab === "analysis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="mdp-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <p className="mdp-sec-eyebrow">Unified Module</p>
                  <h3 className="mdp-sec-title">Match Analytics</h3>
                </div>
                <button className="mdp-replay-btn" onClick={() => setShowExpandedAnalytics((p) => !p)}>
                  {showExpandedAnalytics ? "Collapse" : "Expand Analytics"}
                </button>
              </div>

              <p className="text-[10px] font-bold tracking-[.14em] uppercase text-[var(--mdp-text-3)] mb-2.5">
                Probability · Pressure · Momentum
              </p>
              <div className="mdp-prob-row">
                <div className="mdp-prob-cell batting">
                  <div className="label">Batting Win</div>
                  <div className="val">{(latestWinPoint?.batting ?? 50).toFixed(0)}%</div>
                </div>
                <div className="mdp-prob-cell bowling">
                  <div className="label">Bowling Win</div>
                  <div className="val">{(latestWinPoint?.bowling ?? 50).toFixed(0)}%</div>
                </div>
                <div className="mdp-prob-cell pressure">
                  <div className="label">Pressure</div>
                  <div className="val text-sm">
                    {(latestWinPoint?.batting ?? 50) > 60 ? "Batting" : (latestWinPoint?.batting ?? 50) < 40 ? "Bowling" : "Balanced"}
                  </div>
                </div>
              </div>

              {showExpandedAnalytics && (
                <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,.8fr)", gap: 14, marginTop: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                      <SectionHeader eyebrow="Charts" title="Win Probability & Trend" />
                      <MatchGraphExplorer currentBattingTeam={overviewBattingTeam} currentBowlingTeam={overviewBowlingTeam} currentOver={displayOver} currentRunRate={inningsRunRate} innings={safeInnings} momentumData={safeMomentumData} winProbabilityData={winProbabilityData} />
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                      <SectionHeader eyebrow="Momentum" title="Compact Heatmap" />
                      <MomentumHeatmap data={safeMomentumData} />
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                      <SectionHeader eyebrow="Signals" title="Insights Feed" />
                      <MatchInsightsPanel matchId={match.slug} />
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 14 }}>
                      <SectionHeader eyebrow="Narrative" title="Storyline" />
                      <MatchNarrativePanel matchId={match.slug} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mdp-card">
              <SectionHeader eyebrow="Shot Analysis" title="Wagon Wheel" />
              <div style={{ height: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <WagonWheel matchId={match.slug} />
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ OVERS TAB — UNTOUCHED ════════════════ */}
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

        {/* ════════════════ SCORECARD TAB ════════════════ */}
        {activeTab === "scorecard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {currentEngineState?.matchEnded && currentEngineState?.winner && (
              <div className="text-[15px] font-bold text-[var(--success)] text-center bg-gradient-to-br from-[var(--success)]/8 to-[var(--brand)]/5 border border-[var(--success)]/20 rounded-xl px-4 py-3.5">
                🏆 {currentEngineState.winner} won {typeof currentEngineState.winBy === "string" ? `by ${currentEngineState.winBy}` : typeof currentEngineState.winBy === "number" ? `by ${currentEngineState.winBy}` : ""}
              </div>
            )}

            <div className="mdp-card">
              <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Innings</p>
              <h3 className="mdp-sec-title" style={{ marginBottom: 14 }}>Scorecard</h3>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {(currentEngineState?.innings || []).map((_, i) => (
                  <button key={i} className={`mdp-innings-btn ${inningsIndex === i ? "active" : ""}`} onClick={() => setSelectedInnings(i)}>
                    Innings {i + 1}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                <StatPill label="Batting Team" value={inningsData?.battingTeam ?? "Unknown"} tone="green" />
                <StatPill label="Bowling Team" value={inningsData?.bowlingTeam ?? "Unknown"} tone="blue" />
                <StatPill label="Score" value={<AnimatedScore value={`${inningsData?.runs ?? 0}/${inningsData?.wickets ?? 0}`} />} tone="neutral" />
                <StatPill label="Over" value={displayOver} tone="amber" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.3fr) minmax(300px,.7fr)", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Batting */}
                <div className="mdp-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <p className="mdp-sec-eyebrow" style={{ marginBottom: 2 }}>Batting Card</p>
                      <h3 className="mdp-sec-title">Batters</h3>
                    </div>
                    <span className="text-[11px] text-[var(--mdp-text-3)] font-semibold">
                      {activePlayers.length === 2 ? `${activePlayers.length} active · ${allPlayers.length} total` : `${allPlayers.length} total`}
                    </span>
                  </div>
                  <div className="grid text-[10px] font-bold tracking-[.14em] uppercase text-[var(--text-3)] gap-2.5 py-1.5 px-3.5 pb-2.5 border-b border-white/6" style={{ gridTemplateColumns: "minmax(140px,1.6fr) .7fr .7fr .7fr .8fr" }}>
                    <span>Batter</span><span className="text-center">R</span><span className="text-center">B</span><span className="text-center">4s/6s</span><span className="text-center">SR</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {players.length ? players.map((player, pidx) => {
                      const sr = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : "0.0";
                      const playerKey = player.name ? `batter-${player.name}` : `batter-${pidx}`;
                      return (
                        <div key={playerKey} className={`mdp-batter-row ${player.isStriker ? "striker" : player.isNonStriker ? "nonstriker" : ""}`}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              {player.isStriker && <span className="text-xs text-[var(--mdp-amber)]">★</span>}
                              {player.isNonStriker && <span className="text-xs text-[var(--mdp-cyan)]">○</span>}
                              <span style={{ fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</span>
                            </div>
                            <span className="text-[11px] text-var(--mdp-text-3)">{player.out ? "out" : "not out"}</span>
                          </div>
                          <span style={{ textAlign: "center", fontWeight: 700, color: "var(--mdp-green)" }}>{player.runs}</span>
                          <span style={{ textAlign: "center", color: "#fff" }}>{player.balls}</span>
                          <span style={{ textAlign: "center", color: "var(--mdp-text-2)" }}>{player.fours}/{player.sixes}</span>
                          <span style={{ textAlign: "center", color: "var(--mdp-amber)" }}>{sr}</span>
                        </div>
                      );
                    }) : <p className="text-sm text-[var(--text-3)] p-2.5">No batting records yet.</p>}
                  </div>
                </div>

                {/* Bowling */}
                <div className="mdp-card">
                  <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Bowling Card</p>
                  <h3 className="mdp-sec-title" style={{ marginBottom: 12 }}>Bowlers</h3>
                  <div className="grid text-[10px] font-bold tracking-[.14em] uppercase text-[var(--text-3)] gap-2.5 py-1.5 px-3.5 pb-2.5 border-b border-white/6" style={{ gridTemplateColumns: "1fr repeat(4,.7fr)" }}>
                    <span>Bowler</span><span className="text-center">O</span><span className="text-center">R</span><span className="text-center">W</span><span className="text-center">Econ</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                    {Object.entries(bowling).length ? Object.entries(bowling).map(([name, stat]) => {
                      const overs = stat.overs ?? 0;
                      const runs = stat.runs ?? 0;
                      const wkts = stat.wickets ?? 0;
                      const economy = overs > 0 ? (runs / overs).toFixed(1) : "0.0";
                      return (
                        <div key={name} className="mdp-bowler-row">
                          <span style={{ color: "#fff", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
                          <span style={{ textAlign: "center", color: "#fff" }}>{overs}</span>
                          <span style={{ textAlign: "center", color: "#fff" }}>{runs}</span>
                          <span style={{ textAlign: "center", fontWeight: 700, color: "var(--mdp-red)" }}>{wkts}</span>
                          <span style={{ textAlign: "center", color: "var(--mdp-cyan)" }}>{economy}</span>
                        </div>
                      );
                    }) : <p className="text-sm text-[var(--text-3)] p-2.5">No bowling records yet.</p>}
                  </div>
                </div>
              </div>

              {/* Right scorecard column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="mdp-card">
                  <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Dismissals</p>
                  <h3 className="mdp-sec-title" style={{ marginBottom: 12 }}>Fall of Wickets</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {wickets.length ? wickets.map((w, i) => (
                      <div key={i} className="text-xs bg-[var(--danger)]/8 border border-[var(--danger)]/20 rounded-lg px-2.5 py-1">
                        <span className="font-bold text-[var(--danger)]">{w.score}/{i + 1}</span>
                        <span className="text-[var(--text-3)] ml-1">({w.over})</span>
                      </div>
                    )) : <p className="text-xs text-var(--mdp-text-3)">No wickets yet.</p>}
                  </div>
                </div>

                <div className="mdp-card">
                  <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Extras</p>
                  <h3 className="mdp-sec-title" style={{ marginBottom: 12 }}>Extras Breakdown</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <StatPill label="Wides" value={extras?.wides ?? 0} />
                    <StatPill label="No Balls" value={extras?.noBalls ?? 0} />
                    <StatPill label="Byes" value={extras?.byes ?? 0} />
                    <StatPill label="Leg Byes" value={extras?.legByes ?? 0} />
                  </div>
                </div>

                <div className="mdp-card">
                  <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Stand</p>
                  <h3 className="mdp-sec-title" style={{ marginBottom: 12 }}>Partnerships</h3>
                  {partnerships.length ? partnerships.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm bg-[var(--success)]/5 border border-[var(--success)]/15 rounded-[9px] px-3.5 py-2.5">
                      <span className="text-white">{p.players}</span>
                      <span className="font-bold text-[var(--success)]">{p.runs} runs</span>
                    </div>
                  )) : <p className="text-xs text-var(--mdp-text-3)">No partnerships yet.</p>}
                </div>

                <div className="mdp-card">
                  <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Top Batters</p>
                  <h3 className="mdp-sec-title" style={{ marginBottom: 12 }}>Player Comparison</h3>
                  {topPlayers.length ? topPlayers.map((player) => {
                    const sr = player.balls > 0 ? ((player.runs / player.balls) * 100).toFixed(1) : "0.0";
                    return (
                      <div key={player.name} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 14, marginBottom: 8 }}>
                        <p style={{ fontWeight: 700, color: "#fff", marginBottom: 4 }}>{player.name}</p>
                        <p className="text-sm text-[var(--mdp-text-2)] mb-1">{player.runs} ({player.balls})</p>
                        <p className="text-sm text-[var(--mdp-amber)] font-semibold">SR: {sr}</p>
                      </div>
                    );
                  }) : <p className="text-xs text-var(--mdp-text-3)">No comparison available yet.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ SQUAD TAB ════════════════ */}
        {activeTab === "squad" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: currentEngineState?.teamA?.name ?? match.team1, squad: teamASquad, accent: "#00E5FF" },
              { label: currentEngineState?.teamB?.name ?? match.team2, squad: teamBSquad, accent: "#00FF87" },
            ].map(({ label, squad, accent }) => (
              <div key={label} className="mdp-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 4, height: 18, borderRadius: 2, background: accent, flexShrink: 0 }} />
                  <div>
                    <p className="mdp-sec-eyebrow">Team Sheet</p>
                    <h3 className="mdp-sec-title">{label}</h3>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {squad.length ? squad.map((player, index) => (
                    <div key={`${player.name}-${index}`} className="mdp-squad-row">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="text-[11px] text-[var(--text-3)] font-mono min-w-[18px]">{String(index + 1).padStart(2, "0")}</span>
                        <span style={{ color: "#fff", fontWeight: 600 }}>{player.name}</span>
                      </div>
                      <span className={`mdp-role-badge ${player.role}`}>{player.role}</span>
                    </div>
                  )) : <p className="text-sm text-var(--mdp-text-3)">No squad data available.</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════════════════ ADMIN TAB ════════════════ */}
        {activeTab === "admin" && isAdmin && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="mdp-card">
              <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Simulation</p>
              <h3 className="mdp-sec-title" style={{ marginBottom: 16 }}>Simulation Controls</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {!matchMeta ? (
                  <TeamSelector
                    onStart={(teamA, teamB) => {
                      const nextMeta = { matchId: match.slug, hostedMatchId: currentHostedMatchId ?? undefined, teamA: { id: teamA.short, name: teamA.name }, teamB: { id: teamB.short, name: teamB.name } };
                      if (isSimulationMatch && currentEngineState) {
                        const teamAXI = buildSimulationPlayingXI(teamA.name);
                        const teamBXI = buildSimulationPlayingXI(teamB.name);
                        const nextState: MatchState = { ...currentEngineState, tossWinner: teamA.name, decision: "BAT", teamA: { ...currentEngineState.teamA, name: teamA.name, squad: teamAXI }, teamB: { ...currentEngineState.teamB, name: teamB.name, squad: teamBXI }, innings: currentEngineState.innings.map((innings, index) => ({ ...innings, battingTeam: index === 0 ? teamA.name : teamB.name, bowlingTeam: index === 0 ? teamB.name : teamA.name })) };
                        hydrateMatchState(match.slug, nextState);
                        setMatchState(match.slug, nextState);
                      }
                      setMatchMeta(nextMeta);
                      setLocalMatchMeta(nextMeta);
                      setStartError(null);
                    }}
                  />
                ) : (
                  <div className="text-sm font-bold text-[var(--success)] bg-[var(--success)]/7 border border-[var(--success)]/20 rounded-[10px] px-4 py-3">
                    ✓ Teams: {matchMeta.teamA.name} vs {matchMeta.teamB.name}
                  </div>
                )}

                {matchMeta && !tossData && (
                  <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 14 }}>
                    <TossPanel
                      teamA={{ name: matchMeta?.teamA.name } as Team}
                      teamB={{ name: matchMeta?.teamB.name } as Team}
                      onConfirm={(winner, decision) => {
                        setTossData({ winner, decision });
                        const nextMeta = { ...matchMeta, toss: { winner: winner.name, decision } };
                        setMatchMeta(nextMeta);
                        setLocalMatchMeta(nextMeta);
                      }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                  <button type="button" disabled={effectiveIsRunning} className={`mdp-admin-btn start`}
                    onClick={async () => {
                      const id = match.slug;
                      if (!id) return setStartError("Missing match id.");
                      if (!matchMeta) return setStartError("Please select teams first.");
                      if (!tossData) return setStartError("Please complete toss first.");
                      if (effectiveIsRunning) return;
                      const latestMeta = getMatchMeta(id);
                      if (!latestMeta?.teamA?.name || !latestMeta?.teamB?.name) return setStartError("Please select teams first.");
                      connectRealtime(id, "match-page-admin-start");
                    }}
                  >
                    {isStarting ? "Starting…" : effectiveIsRunning ? "▶ Running" : "▶ Start Simulation"}
                  </button>

                  {effectiveIsRunning && (
                    <button type="button" className={`mdp-admin-btn pause`}
                      onClick={async () => {
                        try {
                          const endpoint = isPaused ? "/api/simulation/resume" : "/api/simulation/pause";
                          await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: match.slug }) });
                          setIsPaused(!isPaused);
                          setStartError(null);
                        } catch { setStartError("Failed to update simulation state."); }
                      }}
                    >
                      {isPaused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                  )}

                  {effectiveIsRunning && (
                    <button type="button" className={`mdp-admin-btn stop`}
                      onClick={async () => {
                        try {
                          await fetch("/api/simulation/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: match.slug }) });
                          setIsRunning(false);
                          setIsPaused(false);
                        } catch (err) { console.error("Stop failed", err); }
                      }}
                    >
                      ⛔ Stop
                    </button>
                  )}

                  {startError && (
                    <div className="text-sm text-[var(--danger)] bg-[var(--danger)]/8 border border-[var(--danger)]/20 rounded-[9px] px-3.5 py-2">
                      {startError}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {[{ label: "1×", value: 1500 }, { label: "2×", value: 700 }, { label: "5×", value: 300 }].map((opt) => (
                    <button key={opt.label} className={`mdp-speed-btn ${speed === opt.value ? "active" : ""}`}
                      onClick={async () => {
                        try { setSpeed(opt.value); await fetch("/api/simulation/speed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ matchId: match.slug, speed: opt.value }) }); }
                        catch (err) { console.error("Speed update failed", err); }
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Delete Simulation */}
            <div className="mdp-card">
              <p className="mdp-sec-eyebrow" style={{ marginBottom: 4 }}>Danger Zone</p>
              <h3 className="mdp-sec-title" style={{ marginBottom: 12 }}>Delete Simulation</h3>
              <p className="text-sm text-[var(--mdp-text-3)] mb-3.5">
                Permanently remove this simulation and all its data. This action cannot be undone.
              </p>
              <button
                type="button"
                className="mdp-admin-btn stop"
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this simulation?")) return;
                  try {
                    const res = await fetch("/api/matches/delete", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ matchId: match.slug }),
                    });
                    if (res.ok) {
                      window.location.href = "/matches";
                    } else {
                      setStartError("Failed to delete simulation.");
                    }
                  } catch (err) {
                    console.error("Delete failed", err);
                    setStartError("Failed to delete simulation.");
                  }
                }}
              >
                🗑 Delete Simulation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right Rail (sticky) ── */}
      {activeTab !== "live" && (
        <div className="hidden lg:block">
          <StickyInsightsRail match={match} sessionMeta={sessionMeta} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// UPGRADED: MatchInnerPage hero scoreboard
// ─────────────────────────────────────────────

function MatchInnerPage({ match, analytics, insights, sessionMeta, liveStatus, hostedMatchId }: {
  match: Match;
  analytics: { winProbability: { over: number; value: number }[]; momentum: { over: number; score: number }[] };
  insights: BroadcastInsight[];
  sessionMeta?: MatchSessionMeta | null;
  liveStatus?: string | null;
  hostedMatchId?: string | null;
}) {
  const { state: currentEngineState } = useMatch();

  if (!currentEngineState) {
    return <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Loading match engine…</div>;
  }

  const currentInnings = currentEngineState.innings?.[currentEngineState.currentInningsIndex ?? 0];
  const runs = Number(currentInnings?.runs ?? 0);
  const wickets = Number(currentInnings?.wickets ?? 0);
  const displayOver = formatOverDisplay(currentInnings?.overs);
  const inningsIndex = currentEngineState.currentInningsIndex ?? 0;

  const battingStats = getBattingStats(match.slug, inningsIndex) as Record<string, { runs?: number; balls?: number }>;
  const bowlingStats = getBowlingStats(match.slug, inningsIndex) as Record<string, { overs?: number; runs?: number; wickets?: number }>;

  const strikerName = currentInnings?.striker;
  const nonStrikerName = currentInnings?.nonStriker;
  const striker = strikerName ? { name: strikerName, runs: battingStats?.[strikerName]?.runs ?? 0, balls: battingStats?.[strikerName]?.balls ?? 0, isStriker: true } : undefined;
  const nonStriker = nonStrikerName ? { name: nonStrikerName, runs: battingStats?.[nonStrikerName]?.runs ?? 0, balls: battingStats?.[nonStrikerName]?.balls ?? 0 } : undefined;
  const bowlerName = currentInnings?.currentBowler;
  const bowler = bowlerName ? { name: bowlerName, overs: bowlingStats?.[bowlerName]?.overs ?? 0, runs: bowlingStats?.[bowlerName]?.runs ?? 0, wickets: bowlingStats?.[bowlerName]?.wickets ?? 0 } : undefined;

  let lastOverBalls: string[] = [];
  if (currentInnings?.overs) {
    const overKeys = Object.keys(currentInnings.overs).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const lastKey = overKeys[overKeys.length - 1];
    const rawBalls = Array.isArray(currentInnings.overs[lastKey]) ? currentInnings.overs[lastKey] : [];
    lastOverBalls = rawBalls.slice(0, 6).map((b: { runs?: number; outcome?: string; extraType?: string; label?: string }) => {
      if (b.outcome === "WICKET") return "W";
      if (b.extraType === "WD") return "Wd";
      if (b.extraType === "NB") return "Nb";
      if (b.runs === 6) return "6";
      if (b.runs === 4) return "4";
      return String(b.runs ?? b.label ?? 0);
    });
  }

  const innings1 = currentEngineState.innings?.[0];
  const innings2 = currentEngineState.innings?.[1];
  const isSecondInningsChase = (currentEngineState.currentInningsIndex ?? 0) === 1;
  const matchMeta = getMatchMeta(match.slug);

  const team1Name = matchMeta?.teamA?.name ?? currentEngineState?.teamA?.name ?? match?.team1 ?? "Team A";
  const team2Name = matchMeta?.teamB?.name ?? currentEngineState?.teamB?.name ?? match?.team2 ?? "Team B";

  let target = 0, runsNeeded = 0, ballsLeft = 0, rrr = 0;
  if (innings1 && innings2 && isSecondInningsChase) {
    target = (innings1.runs ?? 0) + 1;
    const currentRuns = innings2.runs ?? 0;
    runsNeeded = target - currentRuns;
    const totalOvers = 20;
    const ballsBowled = Math.floor(displayOver) * 6 + Math.round((displayOver % 1) * 10);
    ballsLeft = totalOvers * 6 - ballsBowled;
    if (ballsLeft > 0) rrr = (runsNeeded / ballsLeft) * 6;
  }

  let crr = 0;
  if (currentInnings) {
    const ballsBowled = Math.floor(displayOver) * 6 + Math.round((displayOver % 1) * 10);
    if (ballsBowled > 0) crr = (runs / ballsBowled) * 6;
  }

  return (
    <main style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1500, margin: "0 auto", padding: "12px 20px 20px" }}>

        {/* ── UPGRADED Hero Scoreboard ── */}
        {currentInnings && (
          <div className="mdp-hero" style={{ marginBottom: 14 }}>
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div className="mdp-hero-eyebrow">
                  <div className="mdp-live-dot" />
                  CricLens Match Center
                </div>
                <h1 className="mdp-hero-title">{team1Name} vs {team2Name}</h1>
                {sessionMeta?.type === "LIVE" && liveStatus && (
                  <p className="text-sm text-[var(--brand)]/80 mt-1">{liveStatus}</p>
                )}
                <p className="mdp-hero-sub">Live command center with realtime commentary, analytics, and replay.</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                <ConnectionStatus hideWhenConnected={false} />
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link href="/" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white/70 rounded-[9px] border border-white/10 bg-white/4 hover:text-white hover:bg-white/8 transition-all">
                    ← Back to Home
                  </Link>
                </motion.div>
              </div>
            </div>

            {/* Match Header (scorecard strip) */}
            <GraphErrorBoundary label="Scorecard Header">
              <MatchHeader
                team1={team1Name} team2={team2Name}
                runs={runs} wickets={wickets}
                over={Math.floor(displayOver)} ball={Math.round((displayOver % 1) * 10)}
                striker={striker} nonStriker={nonStriker} bowler={bowler}
                lastOverBalls={lastOverBalls}
                isLive={!currentEngineState.matchEnded}
                matchEnded={currentEngineState.matchEnded}
                winner={currentEngineState.winner}
                winBy={currentEngineState.winBy}
                target={isSecondInningsChase && innings2 ? target : undefined}
                rrr={isSecondInningsChase && innings2 && !currentEngineState.matchEnded ? rrr : undefined}
                crr={crr}
              />
            </GraphErrorBoundary>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px,1fr))", gap: 8, marginTop: 14 }}>
              <StatPill label={innings1?.battingTeam ?? "Team 1"} value={`${innings1?.runs ?? 0}/${innings1?.wickets ?? 0}`} tone="green" />
              <StatPill label={innings2?.battingTeam ?? "Team 2"} value={innings2 ? `${innings2.runs}/${innings2.wickets}` : "Yet to bat"} tone="blue" />
              <StatPill label="Innings" value={`Inn ${(currentEngineState.currentInningsIndex ?? 0) + 1}`} tone="neutral" />
              <StatPill label="Over" value={displayOver} tone="amber" />
              {isSecondInningsChase && innings2 && !currentEngineState.matchEnded && <StatPill label="Target" value={target} tone="neutral" />}
              {isSecondInningsChase && innings2 && !currentEngineState.matchEnded && <StatPill label="RRR" value={rrr ? rrr.toFixed(2) : "0.00"} tone="red" />}
              <StatPill label="CRR" value={crr ? crr.toFixed(2) : "0.00"} tone="blue" />
              <StatPill label="Status" value={getLiveMatchStatusLabel(currentEngineState.matchEnded, sessionMeta?.sessionState)} tone="neutral" />
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <GraphErrorBoundary label="Tabs">
          <TabsArea match={match} analytics={analytics} insights={insights} sessionMeta={sessionMeta} hostedMatchId={hostedMatchId} />
        </GraphErrorBoundary>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// MatchDetailPage — outer shell (unchanged logic)
// ─────────────────────────────────────────────

export default function MatchDetailPage({ params }: { params: Promise<{ runtimeMatchId: string }> }) {
  const resolvedParams = use(params);
  const matchId: string | undefined = useMemo(() => {
    const runtimeMatchId = resolvedParams.runtimeMatchId;
    if (typeof runtimeMatchId === "string") return runtimeMatchId;
    if (Array.isArray(runtimeMatchId)) return runtimeMatchId[0];
    return undefined;
  }, [resolvedParams.runtimeMatchId]);

  const [match, setMatch] = useState<Match | undefined>();
  const [sessionMeta, setSessionMeta] = useState<MatchSessionMeta | null>(null);
  const [hostedMatchId, setHostedMatchId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [insights, setInsights] = useState<BroadcastInsight[]>([]);

  type WinPoint = { over: number; value: number; confidence?: number; delta?: number; modelVersion?: string; timestamp?: number; marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT" };
  type MomentumPoint = { over: number; score: number };

  const [analytics, setAnalytics] = useState<{ winProbability: WinPoint[]; momentum: MomentumPoint[] }>({ winProbability: [], momentum: [] });
  const { events: replayEvents } = useReplayEvents(matchId);
  const safeReplayEvents = Array.isArray(replayEvents) ? replayEvents : [];
  const normalizedReplayEvents = useMemo(() => dedupeReplayEvents(safeReplayEvents), [safeReplayEvents]);
  const replayHydratedAnalytics = useMemo(() => {
    const replayWinProbability = getWinProbabilityData(normalizedReplayEvents);
    const replayMomentum = getMomentumData(normalizedReplayEvents);
    return { winProbability: replayWinProbability.length ? replayWinProbability : analytics.winProbability, momentum: replayMomentum.length ? replayMomentum : analytics.momentum };
  }, [analytics.momentum, analytics.winProbability, normalizedReplayEvents]);

  useEffect(() => { initTacticalOverlayBridge(); initCommentaryVoice(); }, []);
  useEffect(() => { enableBroadcast(); return () => disableBroadcast(); }, []);

  useEffect(() => {
    if (!matchId) return;
    const id = matchId;
    let cancelled = false;
    const likelyLiveMatchId = id.startsWith("live_");
    if (likelyLiveMatchId) connectRealtime(id, AUTO_RECONNECT_SUBSCRIBER_ID, { autoStartSimulation: false });

    async function loadMatch() {
      try {
        const res = await fetch(`/api/match/${id}`, { cache: "no-store" });
        if (!res.ok) { console.error("MATCH API ERROR", await res.text()); return; }
        const data = await res.json();
        if (!data?.success || !data?.match) { console.error("Match not found in Redis for", id); return; }

        hydrateMatchState(id, data.match);
        setSessionMeta(data.registry ?? null);
        const loadedHostedMatchId = resolveHostedMatchId(data.match.hostedMatchId) ?? resolveHostedMatchId(data.hostedMatchId);
        setHostedMatchId(loadedHostedMatchId);
        setLiveStatus(typeof data.liveStatus === "string" && data.liveStatus.trim() ? data.liveStatus.trim() : null);
        setMatchState(id, data.match);

        const teamAName = data.match.teamA?.name;
        const teamBName = data.match.teamB?.name;
        const getTeamIdOrSlug = (existingId: unknown, name: string) => { if (typeof existingId === "string" && existingId.trim()) return existingId; return name.toLowerCase().trim().replace(/\s+/g, "-"); };

        if (teamAName && teamBName) {
          setMatchMeta({ matchId: id, hostedMatchId: loadedHostedMatchId ?? undefined, teamA: { id: getTeamIdOrSlug(data.match.teamA?.id, teamAName), name: teamAName }, teamB: { id: getTeamIdOrSlug(data.match.teamB?.id, teamBName), name: teamBName }, ...(data.match.tossWinner && data.match.tossDecision ? { toss: { winner: data.match.tossWinner, decision: data.match.tossDecision } } : {}) });
        }

        if (!cancelled) {
          setMatch({ id, slug: id, team1: teamAName ?? "Team A", team2: teamBName ?? "Team B", currentOver: 0, currentBall: 0, status: data.match.matchEnded ? "Completed" : "Live" });
        }

        const runtime = data.runtime;
        const matchNotEnded = !data.match.matchEnded;
        const isSimulationRunning = runtime?.isRunning === true && matchNotEnded;
        const isLiveMatch = data.registry?.type === "LIVE";
        const shouldConnectSSE = (isSimulationRunning || isLiveMatch) && matchNotEnded;

        if (!cancelled) {
          if (shouldConnectSSE) { connectRealtime(id, AUTO_RECONNECT_SUBSCRIBER_ID, { autoStartSimulation: !isLiveMatch }); }
          else if (likelyLiveMatchId) { disconnectRealtime(id, AUTO_RECONNECT_SUBSCRIBER_ID); }
        }
      } catch (err) { console.error("LOAD MATCH ERROR", err); }
    }

    loadMatch();
    return () => { cancelled = true; };
  }, [matchId]);

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; probability?: number; awayProbability?: number; over?: number; ball?: number; innings?: number; timestamp?: number; modelVersion?: string; insights?: BroadcastInsight[]; analytics?: { winProbability: WinPoint[]; momentum: MomentumPoint[]; prediction?: unknown } }>;
      const data = customEvent.detail;
      if (data.type === "BALL_EVENT") {
        if (data.insights) setInsights(data.insights);
        if (data.analytics) setAnalytics(data.analytics);
      } else if (data.type === "WIN_PROBABILITY_UPDATE" && typeof data.probability === "number" && typeof data.over === "number" && typeof data.ball === "number") {
        setAnalytics((prev) => ({ ...prev, winProbability: [...prev.winProbability, { over: data.over! + data.ball! / 10, value: Number(data.probability), timestamp: typeof data.timestamp === "number" ? data.timestamp : Date.now() }] }));
      }
    };
    window.addEventListener("CRIC_UPDATE", handler);
    return () => window.removeEventListener("CRIC_UPDATE", handler);
  }, []);

  if (!matchId) {
    return (
      <PageMotion>
        <div style={{ background: "var(--surface-2)" }}>
          <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Invalid match URL.</div>
        </div>
      </PageMotion>
    );
  }

  return (
    <MatchProvider matchId={matchId}>
      <PageMotion>
        {/* Inject scoped styles once */}
        <style>{MATCH_PAGE_STYLES}</style>
        <div className="mdp-root" style={{ background: "var(--surface-2)" }}>
          {match ? (
            <MatchInnerPage match={match} analytics={replayHydratedAnalytics} insights={insights} sessionMeta={sessionMeta} liveStatus={liveStatus} hostedMatchId={hostedMatchId} />
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Loading match…</div>
          )}
        </div>
      </PageMotion>
    </MatchProvider>
  );
}