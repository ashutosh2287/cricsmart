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
import MatchTimelineSlider from "@/components/MatchTimelineSlider";
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
type AnalysisFilter = "ALL" | "BATTING" | "BOWLING" | "PRESSURE";


export default function MatchDetailPage() {

  const params = useParams();
  

  const matchId: string | undefined = useMemo(() => {
    const slug = params.slug;

    if (typeof slug === "string") return slug;
    if (Array.isArray(slug)) return slug[0];

    return undefined;
  }, [params.slug]);

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
    } else {
  initMatch(id);
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
    return engineState ?? getMatchState(matchId);
  }, [engineState, matchId]);

  if (!matchId) return null;

  if (!match) {
  return (

    <PageMotion>
   
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">

        <h1 className="text-3xl font-bold text-white">
          Match Not Found
        </h1>

        <p className="text-gray-400 max-w-md">
          The match you are looking for does not exist or
          has not been loaded yet.
        </p>

        <Link
          href="/matches"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg transition shadow-lg shadow-blue-500/30"
        >
          Browse Matches
        </Link>

      </div>

    </PageMotion>

  );
}

  const innings =
    currentEngineState?.innings?.[
      currentEngineState.currentInningsIndex ?? 0
    ];

  return (

    <PageMotion>
      <div className="
      min-h-screen 
      bg-gradient-to-br 
      from-[#0f172a] 
      via-[#1e293b] 
      to-[#020617]
    ">
  <MatchProvider value={{ matchId, state: currentEngineState }}>

    <main className="space-y-8 relative overflow-hidden">

     <div className="max-w-7xl mx-auto px-6 py-6 grid gap-8 lg:grid-cols-[2fr_1fr] items-start">

      {/* LEFT SIDE — MAIN MATCH CONTENT */}

      <div className="lg:col-span-2 space-y-8 max-w-6xl">

        {/* MATCH HEADER */}

       {innings && (
  <>
    <MatchHeader
  team1={match.team1}
  team2={match.team2}
  runs={innings.runs}
  wickets={innings.wickets}
  over={innings.over}
  ball={innings.ball}
/>

<LiveMatchStatus />

<div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"/>
  </>
)}


       

        {/* MATCH TABS */}

        <TabsArea match={match} />

      </div>

      {/* RIGHT SIDE — INTELLIGENCE PANELS */}



      {/* GLOBAL OVERLAYS */}

     <TacticalOverlay /> 
      {showReplay && (
        <ReplayOverlay
          matchId={matchId}
          onClose={() => setShowReplay(false)}
        />
      )}

      {/* DEV BROADCAST TOOLS */}

      {process.env.NODE_ENV === "development" && (
        <div className="mt-12 border-t border-gray-700 pt-6 space-y-4 lg:col-span-3">
          <BroadcastDirectorPanel />
          <BroadcastControlDashboard />
        </div>
      )}

    </div>
    </main>
    </MatchProvider>
    </div>
    </PageMotion>
  );
  
}



function TabsArea({ match }: { match: Match }) {

  const isLoading = !match;
  const [activeTab, setActiveTab] = useState("overview");
  

// 🔥 ADD HERE
const [analysisFilter, setAnalysisFilter] = useState<
  "ALL" | "BATTING" | "BOWLING" | "PRESSURE"
>("ALL");
  const [isRunning, setIsRunning] = useState(false);
const [isPaused, setIsPaused] = useState(false);
const [speed, setSpeed] = useState(1500);
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
            onClick={() => setActiveTab(tab)}
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

  const batting = getBattingStats(match.slug);
  const bowling = getBowlingStats(match.slug);
  const extras = getExtras(match.slug);
  const topPlayers = Object.entries(batting)
  .sort((a, b) => (b[1].runs ?? 0) - (a[1].runs ?? 0))
  .slice(0, 2);

  const players = Object.entries(batting);
  const wickets = getFallOfWickets(match.slug) ?? [];
  type Partnership = {
  players: string;
  runs: number;
};

const partnerships: Partnership[] = Object.entries(batting)
  .slice(-2)
  .map(([name, s]) => {
    const player = s as { runs?: number };
    return {
      players: name,
      runs: player.runs ?? 0
    };
  });

  type FallOfWicket = {
  score: number;
  wicket: number;
  over: string;
};

  return (
    <div className="space-y-6">

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

          {players.map(([name, s], index) => {

            const player = s as {
              runs?: number;
              balls?: number;
              fours?: number;
              sixes?: number;
              out?: boolean;
            };

            const runs = player.runs ?? 0;
            const balls = player.balls ?? 0;
            const fours = player.fours ?? 0;
            const sixes = player.sixes ?? 0;
            const isOut = player.out ?? false;

            const sr =
              balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

            const isCurrent = index >= players.length - 2;
            

            return (
              <div
                key={name}
                className={`p-3 rounded-lg flex justify-between items-center transition
                  ${isCurrent ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-gray-800/40"}
                `}
              >

                {/* LEFT */}
                <div className="flex flex-col">

                  <span className="font-medium">

                    {isCurrent && (
                      <span className="text-yellow-400 mr-1">★</span>
                    )}

                    {name}

                    <span className="ml-2 text-xs text-gray-400">
                      {isOut ? "out" : "not out"}
                    </span>

                  </span>

                  <span className="text-xs text-gray-500">
                    {fours}x4 • {sixes}x6
                  </span>
                  {isCurrent && (
  <span className="animate-pulse text-green-400 ml-2">
    ●
  </span>
)}

                </div>

                {/* RIGHT */}
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
      <GlassPanel>
  <h3 className="text-sm text-gray-400 mb-3 uppercase">
    Fall of Wickets
  </h3>

  <div className="flex flex-wrap gap-3 text-sm">

    {wickets.map((w, i) => (
      <div
        key={i}
        className="bg-gray-800/40 px-3 py-1 rounded"
      >
        {w.score}/{w.wicket} ({w.over})
      </div>
    ))}

  </div>
</GlassPanel>

      {/* ========================= */}
      {/* 🔥 BOWLING CARD */}
      {/* ========================= */}
      <GlassPanel>

  <h3 className="text-sm text-gray-400 mb-4 uppercase tracking-wide">
    Bowling
  </h3>

  {/* 🔥 HEADER */}
  <div className="grid grid-cols-5 text-xs text-gray-400 mb-2 px-2">
    <span className="text-left">Bowler</span>
    <span className="text-center">O</span>
    <span className="text-center">R</span>
    <span className="text-center">W</span>
    <span className="text-center">Econ</span>
  </div>

  {/* 🔥 DATA */}
  <div className="space-y-2">

    {Object.entries(bowling).map(([name, s]) => {

      const bowler = s as {
        overs?: number;
        runs?: number;
        wickets?: number;
      };

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

          <span className="text-left font-medium">
            {name}
          </span>

          <span className="text-center">
            {overs}
          </span>

          <span className="text-center">
            {runs}
          </span>

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

      {/* ========================= */}
      {/* 🔥 EXTRAS + SUMMARY */}
      {/* ========================= */}
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

      <GlassPanel>
  <h3 className="text-sm text-gray-400 mb-3 uppercase">
    Partnerships
  </h3>

  <div className="space-y-2">

    {partnerships.map((p, i) => (
      <div
        key={i}
        className="bg-gray-800/40 p-3 rounded flex justify-between"
      >
        <span>{p.players}</span>
        <span className="text-green-400 font-semibold">
          {p.runs} runs
        </span>
      </div>
    ))}

  </div>
</GlassPanel>

<GlassPanel>
  <h3 className="text-sm text-gray-400 mb-3 uppercase">
    Player Comparison
  </h3>

  <div className="grid grid-cols-2 gap-4 text-sm">

    {topPlayers.map(([name, s]) => {

      const player = s as {
        runs?: number;
        balls?: number;
      };

      const runs = player.runs ?? 0;
      const balls = player.balls ?? 0;

      const sr =
        balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0.0";

      return (
        <div
          key={name}
          className="bg-gray-800/40 p-3 rounded"
        >
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

    {/* ▶ START / ⏹ STOP */}
    <button
      onClick={() => {
        const id = match.slug;
        if (!id) return;

        if (!isRunning) {
          console.log("🚀 START");

          initMatch(id);

          startSimulation(
            {
              over: 0,
              ball: 0,
              totalRuns: 0,
              wickets: 0,

              striker: "Virat Kohli",
              nonStriker: "Rohit Sharma",
              bowler: "Mitchell Starc",

              battingOrder: ["Virat Kohli", "Rohit Sharma", "Gill", "Hardik"],
              bowlingOrder: ["Mitchell Starc", "Pat Cummins", "Hazlewood"],

              currentBowlerIndex: 0,
              nextBatsmanIndex: 2,
              phase: "POWERPLAY",
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

    {/* ⏸ PAUSE / ▶ RESUME */}
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

    {/* ⚡ SPEED CONTROL */}
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
}