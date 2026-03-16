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
  <MatchProvider value={{ matchId, state: currentEngineState }}>

      <main className=" space-y-8">

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

        {/* MATCH ANALYTICS */}

<div className="relative space-y-6">

  {/* subtle glow background */}
  <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 blur-[120px] pointer-events-none"/>

  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-800 pb-2">
    Match Analytics
  </h2>

  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
    <MatchControlPanel matchId={matchId} />
  </div>

  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-lg">
    <MatchInsightsPanel matchId={matchId} />
  </div>

</div>

        {/* MATCH STORY */}

        <MatchStory matchId={matchId} />

        {/* HIGHLIGHT TIMELINE */}

        <HighlightTimeline matchId={matchId} />

        {/* TIMELINE SCRUBBER */}

        <MatchTimelineSlider matchId={matchId} />

        {/* MATCH TABS */}

        <TabsArea match={match} />

      </div>

      {/* RIGHT SIDE — INTELLIGENCE PANELS */}

<div className="space-y-8 sticky top-6">

 <div className="glass-panel p-5">
    <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">
      Strategy Dashboard
    </h2>

    <StrategyDashboard matchId={matchId} />
  </div>

  <div className="glass-panel p-5">
    <h2 className="text-sm font-semibold text-gray-400 uppercase mb-3">
      Momentum Map
    </h2>

    <MomentumHeatmap matchId={matchId} />
    
    <MatchPhaseTimeline matchId={matchId} />
  </div>

</div>

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
    </PageMotion>
  );
  
}



function TabsArea({ match }: { match: Match }) {

  const [activeTab, setActiveTab] = useState("live");

  return (
    <>
      <div className="flex gap-6 border-b border-gray-700 pb-3 text-sm font-medium">

        <button
  className={`transition-colors ${
  activeTab === "live"
    ? "text-white border-b-2 border-blue-500 pb-2"
    : "text-gray-400 hover:text-white"
}`}
  onClick={() => setActiveTab("info")}
>
  Info
</button>

        <button
          className={`transition-colors ${
            activeTab === "live"
              ? "text-white border-b-2 border-blue-500 pb-2"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("live")}
        >
          Live
        </button>

        <button
          className={`transition-colors ${
            activeTab === "scorecard"
              ? "text-white border-b-2 border-blue-500 pb-2"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("scorecard")}
        >
          Scorecard
        </button>

        <button
          className={`transition-colors ${
            activeTab === "overs"
              ? "text-white border-b-2 border-blue-500 pb-2"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("overs")}
        >
          Overs
        </button>

        <button
          className={`transition-colors ${
            activeTab === "highlights"
              ? "text-white border-b-2 border-blue-500 pb-2"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("highlights")}
        >
          Highlights
        </button>

        <button
          className={`transition-colors ${
            activeTab === "admin"
              ? "text-white border-b-2 border-blue-500 pb-2"
              : "text-gray-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("admin")}
        >
          Admin
        </button>

      </div>

      {activeTab === "info" && <div>Match Info Coming Soon...</div>}

      {activeTab === "live" && <BroadcastLiveView match={match} />}

      {activeTab === "scorecard" && (
        <div>Scorecard View Coming Soon...</div>
      )}

      {activeTab === "overs" && (
        <OversTimeline slug={match.slug} />
      )}

      {activeTab === "highlights" && (
        <div>Highlights Coming Soon...</div>
      )}

      {activeTab === "admin" && (
        <AdminScoringPanel matchId={match.slug} />
      )}

    </>
  );
}