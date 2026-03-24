"use client";

import AdminScoringPanel from "@/components/admin/AdminScoringPanel";
import { useEffect, useMemo, useState } from "react";
import {
  getMatchState,
  subscribeMatch,
  MatchState,
  hydrateMatchState
} from "@/services/matchEngine";
import { useParams } from "next/navigation";
import { enableBroadcast, disableBroadcast } from "@/services/broadcastMode";
import { Match } from "@/types/match";
import OversTimeline from "@/components/OversTimeline";
import { getMatchBySlug } from "@/services/matchService";
import { connectRealtime, disconnectRealtime } from "@/services/realtimeService";
import ReplayOverlay from "@/components/replay/ReplayOverlay";
import TacticalOverlay from "@/components/TacticalOverlay";
import { initTacticalOverlayBridge } from "@/services/tacticalOverlayBridge";
import MatchStory from "@/components/MatchStory";
import { initCommentaryVoice } from "@/services/commentary/commentaryVoiceEngine";
import BroadcastDirectorPanel from "@/components/BroadcastDirectorPanel";
import BroadcastControlDashboard from "@/components/BroadcastControlDashboard";
import MatchControlPanel from "@/components/MatchControlPanel";
import MatchHeader from "@/components/MatchHeader";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import PageMotion from "@/components/ui/PageMotion";
import MatchInsightsPanel from "@/components/analytics/MatchInsightsPanel";
import Link from "next/link";
import { MatchProvider } from "@/context/MatchContext";
import LiveMatchStatus from "@/components/LiveMatchStatus";
import { startLiveMatchIngestor, stopLiveMatchIngestor } from "@/services/ingestion/liveMatchIngestor";
import CommentaryPanel from "@/components/match/CommentaryPanel";
import { initMatch } from "@/services/matchEngine";
import GlassPanel from "@/components/ui/GlassPanel";
import { useMatch } from "@/context/MatchContext";
import { getBattingOrder, getBowlingOrder } from "@/services/simulation/lineup";
import { use } from "react";
import React from "react";
import {
  startSimulation,
  stopSimulation,
  pauseSimulation,
  resumeSimulation,
  setSimulationSpeed
} from "@/services/simulation/matchSimulator";

import MatchNarrativePanel from "@/components/analytics/MatchNarrativePanel";
import PartnershipPanel from "@/components/PartnershipPanel";
import HighlightTimeline from "@/components/HighlightTimeline";
import {
  getBattingStats,
  getBowlingStats,
  getFallOfWickets,
  getExtras
} from "@/services/analytics/scorecardEngine";
import WinProbabilityChart from "@/components/analytics/WinProbabilityChart";
import ReplaySlider from "@/components/match/ReplaySlider";
import TeamSelector from "@/components/teams/TeamSelector";
import { Team } from "@/data/teams";
import TossPanel from "@/components/match/TossPanel";
type AnalysisFilter = "ALL" | "BATTING" | "BOWLING" | "PRESSURE";


const TabsArea = React.memo(function TabsArea({ match }: { match: Match }) {
  const isLoading = !match;
  const [activeTab, setActiveTab] = useState(() => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("activeTab") || "overview";
  }
  return "overview";
});
    const { state: currentEngineState } = useMatch();
    

  

// 🔥 ADD HERE
const [analysisFilter, setAnalysisFilter] = useState<
  "ALL" | "BATTING" | "BOWLING" | "PRESSURE"
>("ALL");
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
const [selectedInnings, setSelectedInnings] = useState(0);
  if (isLoading) {
  return (
    <div className="space-y-4">
      <div className="h-6 w-40 bg-white/10 animate-pulse rounded" />
      <div className="h-[200px] bg-white/10 animate-pulse rounded" />
      <div className="h-[150px] bg-white/10 animate-pulse rounded" />
    </div>
  );
}

  return (
    <>
      {/* TAB HEADER */}
      <div className="
  flex gap-6 
  border-b border-gray-700 
  pb-3 
  text-sm font-medium
  sticky top-16 z-40
  bg-black/40 backdrop-blur-md
">

        {["overview", "live", "analysis", "timeline", "scorecard", "admin"].map(tab => (
          <button
            key={tab}
            onClick={() => {
  setActiveTab(tab);
  localStorage.setItem("activeTab", tab);
}}
            className={`capitalize transition-colors ${
              activeTab === tab
                ? "text-white border-b-2 border-blue-500 pb-2"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}

      </div>

      {/* TAB CONTENT */}




{activeTab === "overview" && (
  <div className="space-y-6">

    {/* CONTROLS */}
    <GlassPanel>
      <MatchControlPanel matchId={match.slug} />
    </GlassPanel>

    {/* STORY */}
    <GlassPanel>
      <MatchStory matchId={match.slug} />
    </GlassPanel>

    {/* MAIN GRAPH */}
    <GlassPanel>
      <WinProbabilityChart matchId={match.slug} />
    </GlassPanel>

    {/* MAIN DASHBOARD GRID */}
    <div className="grid lg:grid-cols-3 gap-6">

      {/* LEFT SIDE (2 columns) */}
      <div className="lg:col-span-2 space-y-6">

        

        {/* MOMENTUM */}
        <GlassPanel>
          <h3 className="text-sm text-gray-400 mb-3 uppercase">
            Momentum
          </h3>
          <MomentumHeatmap matchId={match.slug} />
        </GlassPanel>

        {/* INSIGHTS */}
        <GlassPanel>
          <MatchInsightsPanel matchId={match.slug} />
        </GlassPanel>

        {/* NARRATIVE */}
        <GlassPanel>
          <MatchNarrativePanel matchId={match.slug} />
        </GlassPanel>

      </div>

      {/* RIGHT SIDE */}
      <div className="space-y-6">

        {/* PARTNERSHIP */}
        <GlassPanel>
          <PartnershipPanel matchId={match.slug} />
        </GlassPanel>

        {/* HIGHLIGHTS */}
        <GlassPanel>
          <HighlightTimeline matchId={match.slug} />
        </GlassPanel>

      </div>

    </div>

  </div>
)}

{activeTab === "live" && (
  <div className="space-y-6">

    <GlassPanel>
      <CommentaryPanel matchId={match.slug} />
    </GlassPanel>

    <GlassPanel>
       <ReplaySlider matchId={match.slug} />

    </GlassPanel>

  </div>
)}
{activeTab === "analysis" && (
  <div className="space-y-6">

    {/* 🔥 FILTER BUTTONS */}
    <div className="flex gap-3 flex-wrap">

      {[
        { key: "ALL", label: "📊 All", color: "bg-blue-600" },
        { key: "BATTING", label: "🏏 Batting", color: "bg-green-600" },
        { key: "BOWLING", label: "🎯 Bowling", color: "bg-red-600" },
        { key: "PRESSURE", label: "⚡ Pressure", color: "bg-yellow-500" }
      ].map(f => (
        <button
          key={f.key}
          onClick={() => setAnalysisFilter(f.key as AnalysisFilter)}
          className={`px-4 py-1.5 rounded-md text-sm transition ${
            analysisFilter === f.key
              ? `${f.color} text-white`
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {f.label}
        </button>
      ))}

    </div>

    {/* ========================= */}
    {/* ALL */}
    {/* ========================= */}
    {analysisFilter === "ALL" && (
      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <GlassPanel>
            <WinProbabilityChart matchId={match.slug} />
          </GlassPanel>

          <GlassPanel>
            <MomentumHeatmap matchId={match.slug} />
          </GlassPanel>

        </div>

        <div className="space-y-6">

          <GlassPanel>
            <MatchInsightsPanel matchId={match.slug} />
          </GlassPanel>

          <GlassPanel>
            <MatchNarrativePanel matchId={match.slug} />
          </GlassPanel>

          <GlassPanel>
            <PartnershipPanel matchId={match.slug} />
          </GlassPanel>

        </div>

      </div>
    )}

    {/* BATTING */}
    {analysisFilter === "BATTING" && (
      <div className="space-y-6">
        <GlassPanel>
          <WinProbabilityChart matchId={match.slug} />
        </GlassPanel>

        <GlassPanel>
          <PartnershipPanel matchId={match.slug} />
        </GlassPanel>

        <GlassPanel>
          <MatchNarrativePanel matchId={match.slug} />
        </GlassPanel>
      </div>
    )}

    {/* BOWLING */}
    {analysisFilter === "BOWLING" && (
      <div className="space-y-6">
        <GlassPanel>
          <MomentumHeatmap matchId={match.slug} />
        </GlassPanel>

        <GlassPanel>
          <MatchInsightsPanel matchId={match.slug} />
        </GlassPanel>

        <GlassPanel>
          <HighlightTimeline matchId={match.slug} />
        </GlassPanel>
      </div>
    )}

    {/* PRESSURE */}
    {analysisFilter === "PRESSURE" && (
      <div className="space-y-6">
        <GlassPanel>
          <WinProbabilityChart matchId={match.slug} />
        </GlassPanel>

        <GlassPanel>
          <MomentumHeatmap matchId={match.slug} />
        </GlassPanel>

        <GlassPanel>
          <MatchInsightsPanel matchId={match.slug} />
        </GlassPanel>
      </div>
    )}

  </div>
)}

 
  

      {activeTab === "timeline" && (
  <div className="space-y-6">

    <HighlightTimeline matchId={match.slug} />

    <OversTimeline slug={match.slug} />

  </div>
)}


{activeTab === "scorecard" && (() => {

  const inningsIndex = selectedInnings;

  const batting = getBattingStats(match.slug, inningsIndex);
  const bowling = getBowlingStats(match.slug, inningsIndex);
  const extras = getExtras(match.slug, inningsIndex);
  const wickets = getFallOfWickets(match.slug, inningsIndex) ?? [];

 const currentInnings =
  currentEngineState?.innings?.[inningsIndex];

  const striker = currentInnings?.striker;
  const nonStriker = currentInnings?.nonStriker;

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

  const players = Object.entries(
    batting as Record<string, PlayerStat>
  );

  const topPlayers = [...players]
    .sort((a, b) => (b[1].runs ?? 0) - (a[1].runs ?? 0))
    .slice(0, 2);

  type Partnership = {
    players: string;
    runs: number;
  };

  const partnerships: Partnership[] = players
    .slice(-2)
    .map(([name, s]) => {
      const player = s as PlayerStat;
      return {
        players: name,
        runs: player.runs ?? 0,
      };
    });



const matchState = currentEngineState ?? null;

const battingTeam =
  selectedInnings === 0
    ? matchState?.teamA?.name ?? "Team A"
    : matchState?.teamB?.name ?? "Team B";

const bowlingTeam =
  selectedInnings === 0
    ? matchState?.teamB?.name ?? "Team B"
    : matchState?.teamA?.name ?? "Team A";

if (!currentEngineState?.innings) {
  return (
    <div className="text-white text-center p-10">
      Preparing match data...
    </div>
  );
}
  return (
    <div className="space-y-6">

      {/* 🔥 TABS */}
      <div className="flex gap-2 mb-2">
        {currentEngineState?.matchEnded && (
  <div className="bg-green-600 text-white p-4 rounded-lg text-center">
    🏆 {currentEngineState.winner} won by {currentEngineState.winBy}
  </div>
)}
        {(currentEngineState?.innings || []).map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedInnings(i)}
            className={`px-4 py-2 rounded-lg text-sm transition
              ${
                selectedInnings === i
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                  : "bg-gray-800/40 text-gray-300 hover:bg-gray-700/40"
              }
            `}
          >
            Innings {i + 1}
          </button>
        ))}
      </div>

      {/* 🔥 TEAM INFO */}
      <div className="flex justify-between text-sm mb-3">
        <span className="text-green-400 font-medium">
          Batting: {battingTeam}
        </span>
        <span className="text-blue-400 font-medium">
          Bowling: {bowlingTeam}
        </span>
      </div>

      {/* ========================= */}
      {/* 🔥 BATTING CARD */}
      {/* ========================= */}
      <GlassPanel>

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm text-gray-400 uppercase tracking-wide">
            Batting
          </h3>

          <span className="text-xs text-gray-500">
            Total Players: {players.length}
          </span>
        </div>

        <div className="space-y-3">

          {players.map(([name, s]) => {

            const player = s as PlayerStat;

            const runs = player.runs ?? 0;
            const balls = player.balls ?? 0;
            const fours = player.fours ?? 0;
            const sixes = player.sixes ?? 0;
            const isOut = player.out ?? false;

            const sr =
              balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

            const isStriker = name === striker;
            const isNonStriker = name === nonStriker;

            return (
              <div
                key={name}
                className={`p-3 rounded-lg flex justify-between items-center transition
                  ${
                    isStriker
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : isNonStriker
                      ? "bg-gray-700/40 border border-gray-600/20"
                      : "bg-gray-800/40"
                  }
                `}
              >

                <div className="flex flex-col">

                  <span className="font-medium">

                    {isStriker && (
                      <span className="text-yellow-400 mr-1">★</span>
                    )}
                    {isStriker && (
                      <span className="animate-pulse text-green-400 ml-2">●</span>
                    )}
                    {isNonStriker && (
                      <span className="text-blue-400 ml-2">○</span>
                    )}

                    {name}

                    <span className="ml-2 text-xs text-gray-400">
                      {isOut ? "out" : "not out"}
                    </span>

                  </span>

                  <span className="text-xs text-gray-500">
                    {fours}x4 • {sixes}x6
                  </span>

                </div>

                <div className="flex items-center gap-6 text-sm">

                  <span className="text-green-400 font-semibold">
                    {runs}
                  </span>

                  <span>{balls}</span>

                  <span
                    className={`font-medium ${
                      Number(sr) > 150
                        ? "text-green-400"
                        : Number(sr) < 100
                        ? "text-red-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {sr}
                  </span>

                </div>

              </div>
            );
          })}

        </div>

      </GlassPanel>

      {/* 🔥 FALL OF WICKETS */}
      <GlassPanel>
        <h3 className="text-sm text-gray-400 mb-3 uppercase">
          Fall of Wickets
        </h3>

        <div className="flex flex-wrap gap-3 text-sm">
          {wickets.map((w, i) => (
            <div key={i} className="bg-gray-800/40 px-3 py-1 rounded">
              {w.score}/{w.wicket} ({w.over})
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* 🔥 BOWLING */}
      <GlassPanel>

        <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">
          Bowling
        </h3>

        <div className="grid grid-cols-5 text-xs text-gray-400 mb-2 px-2">
          <span>Bowler</span>
          <span className="text-center">O</span>
          <span className="text-center">R</span>
          <span className="text-center">W</span>
          <span className="text-center">Econ</span>
        </div>

        <div className="space-y-2">

          {Object.entries(bowling).map(([name, s]) => {

            const bowler = s as BowlerStat;

            const overs = bowler.overs ?? 0;
            const runs = bowler.runs ?? 0;
            const wickets = bowler.wickets ?? 0;

            const economy =
              overs > 0 ? (runs / overs).toFixed(1) : "0.0";

            return (
              <div
                key={name}
                className="grid grid-cols-5 items-center bg-gray-800/40 rounded-lg px-2 py-2 hover:bg-gray-800/60 transition"
              >
                <span>{name}</span>
                <span className="text-center">{overs}</span>
                <span className="text-center">{runs}</span>
                <span className="text-center text-red-400 font-semibold">
                  {wickets}
                </span>
                <span className="text-center text-blue-400">
                  {economy}
                </span>
              </div>
            );
          })}

        </div>

      </GlassPanel>

      {/* 🔥 EXTRAS */}
      <GlassPanel>

        <h3 className="text-sm text-gray-400 mb-3 uppercase">
          Extras
        </h3>

        <div className="grid grid-cols-4 gap-4 text-center text-sm">

          <div className="bg-gray-800/40 p-2 rounded">
            <p className="text-gray-400 text-xs">Wides</p>
            <p className="font-semibold">{extras.wides}</p>
          </div>

          <div className="bg-gray-800/40 p-2 rounded">
            <p className="text-gray-400 text-xs">No Balls</p>
            <p className="font-semibold">{extras.noBalls}</p>
          </div>

          <div className="bg-gray-800/40 p-2 rounded">
            <p className="text-gray-400 text-xs">Byes</p>
            <p className="font-semibold">{extras.byes}</p>
          </div>

          <div className="bg-gray-800/40 p-2 rounded">
            <p className="text-gray-400 text-xs">Leg Byes</p>
            <p className="font-semibold">{extras.legByes}</p>
          </div>

        </div>

      </GlassPanel>

      {/* 🔥 PARTNERSHIP */}
      <GlassPanel>
        <h3 className="text-sm text-gray-400 mb-3 uppercase">
          Partnerships
        </h3>

        <div className="space-y-2">
          {partnerships.map((p, i) => (
            <div key={i} className="bg-gray-800/40 p-3 rounded flex justify-between">
              <span>{p.players}</span>
              <span className="text-green-400 font-semibold">
                {p.runs} runs
              </span>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* 🔥 PLAYER COMPARISON */}
      <GlassPanel>
        <h3 className="text-sm text-gray-400 mb-3 uppercase">
          Player Comparison
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">

          {topPlayers.map(([name, s]) => {

            const player = s as PlayerStat;

            const runs = player.runs ?? 0;
            const balls = player.balls ?? 0;

            const sr =
              balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

            return (
              <div key={name} className="bg-gray-800/40 p-3 rounded">
                <p className="font-medium">{name}</p>
                <p>{runs} ({balls})</p>
                <p className="text-yellow-400">SR: {sr}</p>
              </div>
            );
          })}

        </div>
      </GlassPanel>

    </div>
  );

})()}

      {activeTab === "admin" && process.env.NODE_ENV === "development" && (
  <div className="space-y-6">

    <AdminScoringPanel matchId={match.slug} />

    <BroadcastDirectorPanel />
    <BroadcastControlDashboard />

    {process.env.NODE_ENV === "development" && (
      <GlassPanel>
        <div className="flex flex-col gap-4">

          {selectedTeams ? (
            <p className="text-green-400">
              Teams Selected: {selectedTeams.teamA.name} vs {selectedTeams.teamB.name}
            </p>
          ) : (
            <GlassPanel>
              <TeamSelector
                onStart={(teamA, teamB) => {
                  setSelectedTeams({ teamA, teamB });
                }}
              />
            </GlassPanel>
          )}
          {/* STEP 2: TOSS */}
  {selectedTeams && !tossData && (
    <GlassPanel>
      <TossPanel
        teamA={selectedTeams.teamA}
        teamB={selectedTeams.teamB}
        onConfirm={(winner, decision) => {
          setTossData({ winner, decision });
        }}
      />
    </GlassPanel>
  )}

          <button
            onClick={() => {
              const id = match.slug;
              if (!id || !selectedTeams) return;

              if (!isRunning) {
                console.log("🚀 START");

                initMatch(id);

                if (!tossData) {
  alert("Please complete toss first");
  return;
}

const { teamA, teamB } = selectedTeams;
const { winner, decision } = tossData;

let firstBattingTeam;
let firstBowlingTeam;

if (decision === "BAT") {
  firstBattingTeam = winner;
  firstBowlingTeam =
    winner.name === teamA.name ? teamB : teamA;
} else {
  firstBowlingTeam = winner;
  firstBattingTeam =
    winner.name === teamA.name ? teamB : teamA;
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
  },
  id,
  speed
);
                setIsRunning(true);
                setIsPaused(false);
              } else {
                console.log("⏹ STOP");

                stopSimulation();
                setIsRunning(false);
                setIsPaused(false);
              }
            }}
            className={`px-4 py-2 rounded font-medium ${
              isRunning ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {isRunning ? "⏹ Stop Simulation" : "▶ Start Simulation"}
          </button>

          {isRunning && (
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
              className="px-4 py-2 rounded bg-yellow-500"
            >
              {isPaused ? "▶ Resume" : "⏸ Pause"}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => {
                setSpeed(1500);
                setSimulationSpeed(1500);
              }}
              className="px-3 py-1 bg-gray-700 rounded"
            >
              1x
            </button>

            <button
              onClick={() => {
                setSpeed(700);
                setSimulationSpeed(700);
              }}
              className="px-3 py-1 bg-gray-700 rounded"
            >
              2x
            </button>

            <button
              onClick={() => {
                setSpeed(300);
                setSimulationSpeed(300);
              }}
              className="px-3 py-1 bg-gray-700 rounded"
            >
              5x
            </button>
          </div>

        </div>
      </GlassPanel>
    )}

  </div>
)}

    </>
    
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

  const [showReplay, setShowReplay] = useState(false);
  const [match, setMatch] = useState<Match | undefined>();
  const [engineState, setEngineState] = useState<MatchState | undefined>();

  /*
  =================================================
  INIT TACTICAL + COMMENTARY SYSTEM
  =================================================
  */

  useEffect(() => {
    initTacticalOverlayBridge();
    initCommentaryVoice();
  }, []);

  /*
  =================================================
  LOAD MATCH DATA
  =================================================
  */

  useEffect(() => {

  if (!matchId) return;

  const id = matchId;

  async function loadMatch() {

    const m = await getMatchBySlug(id);

    setMatch(m);

    if (m?.engineState) {
  hydrateMatchState(id, m.engineState);
  setEngineState(getMatchState(id)); // ✅ ADD THIS
} else {
  initMatch(id);
  setEngineState(getMatchState(id)); // ✅ ADD THIS
}

  }

  loadMatch();

}, [matchId]);

  /*
  =================================================
  REALTIME CONNECTION
  =================================================
  */

  useEffect(() => {

    if (!matchId) return;

    connectRealtime(matchId!);

    return () => {
  disconnectRealtime();
};

  }, [matchId]);

  /*
=================================================
LIVE API INGESTION
=================================================
*/

useEffect(() => {

  if (!matchId || !match?.externalMatchId) return;

  console.log("Starting live ingestor:", match.externalMatchId);

  startLiveMatchIngestor(
    matchId,
    match.externalMatchId
  );

  return () => {
    stopLiveMatchIngestor(matchId);
  };

}, [matchId, match]);

  /*
  =================================================
  BROADCAST MODE
  =================================================
  */

  useEffect(() => {

    enableBroadcast();

    return () => disableBroadcast();

  }, []);

  /*
  =================================================
  ENGINE SUBSCRIPTION
  =================================================
  */

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

  /*
  =================================================
  DERIVED ENGINE STATE
  =================================================
  */

  const currentEngineState = useMemo(() => {
  if (!matchId) return undefined;

  const state = engineState ?? getMatchState(matchId);

  if (!state) {
    initMatch(matchId); // 🔥 fallback
    return getMatchState(matchId);
  }

  return state;
}, [engineState, matchId]);

const currentInnings = useMemo(() => {
  if (!currentEngineState) return undefined;

  return currentEngineState.innings?.[
    currentEngineState.currentInningsIndex ?? 0
  ];
}, [currentEngineState]);

const oversKeys = currentInnings?.overs
  ? Object.keys(currentInnings.overs)
  : [];

const currentOverNumber = oversKeys.length
  ? Number(oversKeys[oversKeys.length - 1])
  : 0;

const currentBalls =
  currentInnings?.overs?.[currentOverNumber]?.length || 0;

  return (
  <PageMotion>
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617]">

<MatchProvider value={{ matchId: matchId!, state: currentEngineState! }}>
        {!currentEngineState ? (
          <div className="text-white text-center p-10">
            Loading match engine...
          </div>
        ) : (
          <main className="space-y-8 relative overflow-hidden">

            <div className="max-w-7xl mx-auto px-6 py-6">

              {/* HEADER */}
              {currentInnings && (
                <MatchHeader
                  team1={currentEngineState.teamA?.name ?? match?.team1 ?? "Team A"}
                  team2={currentEngineState.teamB?.name ?? match?.team2 ?? "Team B"}
                  runs={currentInnings.runs || 0}
                  wickets={currentInnings.wickets || 0}
                  over={currentOverNumber}
                  ball={currentBalls}
                />
              )}

              <LiveMatchStatus />

              {/* TABS */}
              {match && <TabsArea match={match} />}

            </div>

          </main>
        )}

      </MatchProvider>

    </div>
  </PageMotion>
);

}
