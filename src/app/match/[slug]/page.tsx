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
import BroadcastLiveView from "@/components/BroadcastLiveView";
import { enableBroadcast, disableBroadcast } from "@/services/broadcastMode";
import { Match } from "@/types/match";
import OversTimeline from "@/components/OversTimeline";
import { getMatchBySlug } from "@/services/matchService";
import { connectRealtime, disconnectRealtime } from "@/services/realtimeService";
import ReplayOverlay from "@/components/replay/ReplayOverlay";
import TacticalOverlay from "@/components/TacticalOverlay";
import { initTacticalOverlayBridge } from "@/services/tacticalOverlayBridge";
import HighlightTimeline from "@/components/HighlightTimeline";
import MatchStory from "@/components/MatchStory";
import { initCommentaryVoice } from "@/services/commentary/commentaryVoiceEngine";
import BroadcastDirectorPanel from "@/components/BroadcastDirectorPanel";
import MatchTimelineSlider from "@/components/MatchTimelineSlider";
import BroadcastControlDashboard from "@/components/BroadcastControlDashboard";
import MatchControlPanel from "@/components/MatchControlPanel";
import MatchHeader from "@/components/MatchHeader";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import StrategyDashboard from "@/components/StrategyDashboard";
import MatchPhaseTimeline from "@/components/MatchPhaseTimeline";
import PageMotion from "@/components/ui/PageMotion";
import MatchInsightsPanel from "@/components/analytics/MatchInsightsPanel";
import Link from "next/link";
import { MatchProvider } from "@/context/MatchContext";
import LiveMatchStatus from "@/components/LiveMatchStatus";
import { startLiveMatchIngestor, stopLiveMatchIngestor } from "@/services/ingestion/liveMatchIngestor";
import CommentaryPanel from "@/components/match/CommentaryPanel";
import { startSimulation, stopSimulation } from "@/services/simulation/matchSimulator";
import { initMatch } from "@/services/matchEngine";
import GlassPanel from "@/components/ui/GlassPanel";

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
  const [isRunning, setIsRunning] = useState(false);
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

        {["overview", "live", "analysis", "timeline", "admin"].map(tab => (
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
  <div className="grid lg:grid-cols-2 gap-6">

    <GlassPanel className="lg:col-span-2">
  <MatchControlPanel matchId={match.slug} />
</GlassPanel>

    {/* STORY */}
    <GlassPanel className="lg:col-span-2">
      <MatchStory matchId={match.slug} />
    </GlassPanel>

    {/* WIN PROBABILITY */}
    <GlassPanel>
      <div className="h-[200px] flex items-center justify-center text-gray-500">
  Win Probability Graph Coming Soon
</div>
    </GlassPanel>

    {/* MOMENTUM */}
    <GlassPanel>
      <h3 className="text-sm text-gray-400 mb-3 uppercase">
        Momentum
      </h3>

      <MomentumHeatmap matchId={match.slug} />
    </GlassPanel>

    {/* INSIGHTS */}
    <GlassPanel className="lg:col-span-2">
      <MatchInsightsPanel matchId={match.slug} />
    </GlassPanel>

  </div>
)}


{activeTab === "live" && (
  <div className="space-y-6">

    <GlassPanel>
      <CommentaryPanel matchId={match.slug} />
    </GlassPanel>

    <GlassPanel>
      <MatchTimelineSlider matchId={match.slug} />
    </GlassPanel>

  </div>
)}

  

      {activeTab === "timeline" && (
  <div className="space-y-6">

    <HighlightTimeline matchId={match.slug} />

    <OversTimeline slug={match.slug} />

  </div>
)}

      

      {activeTab === "admin" && process.env.NODE_ENV === "development" && (
        
  <div className="space-y-6">

    <AdminScoringPanel matchId={match.slug} />

    <BroadcastDirectorPanel />
    <BroadcastControlDashboard />

    {process.env.NODE_ENV === "development" && (
  <GlassPanel>
    

<GlassPanel>
  <div className="flex gap-3">

    <button
      onClick={() => {
        const id = match.slug;

        if (!id) {
          console.log("❌ No matchId");
          return;
        }

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

              battingOrder: [
                "Virat Kohli",
                "Rohit Sharma",
                "Gill",
                "Hardik"
              ],

              bowlingOrder: [
                "Mitchell Starc",
                "Pat Cummins",
                "Hazlewood"
              ],

              currentBowlerIndex: 0,
              nextBatsmanIndex: 2,
              phase: "POWERPLAY",
            },
            id
          );

          setIsRunning(true);

        } else {
          console.log("🛑 STOP");

          stopSimulation();
          setIsRunning(false);
        }
      }}
      className={`px-4 py-2 rounded font-medium transition ${
        isRunning
          ? "bg-red-600 hover:bg-red-500"
          : "bg-green-600 hover:bg-green-500"
      }`}
    >
      {isRunning ? "⏹ Stop Simulation" : "▶ Start Simulation"}
    </button>

  </div>
</GlassPanel>
  </GlassPanel>
)}

  </div>
)}

    </>
  );
}