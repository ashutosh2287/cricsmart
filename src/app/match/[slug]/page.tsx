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
  INIT TACTICAL OVERLAY SYSTEM
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

    const id = matchId;

    connectRealtime(id);

    return () => {
      disconnectRealtime();
    };

  }, [matchId]);

  /*
  =================================================
  BROADCAST MODE
  =================================================
  */

  useEffect(() => {

    enableBroadcast();

    return () => {
      disableBroadcast();
    };

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
    return <div className="p-6">Match not found</div>;
  }

  const innings =
  currentEngineState?.innings[
    currentEngineState.currentInningsIndex
  ];

  
  return (
  <div className="p-6 space-y-8">

    {/* MATCH HEADER */}

   {innings && (
  <MatchHeader
    team1={match.team1}
    team2={match.team2}
    runs={innings.runs}
    wickets={innings.wickets}
    over={innings.over}
    ball={innings.ball}
  />
)}


    {/* MAIN ANALYTICS DASHBOARD */}

    <MatchControlPanel matchId={matchId} />


    {/* MATCH STORY */}

    <MatchStory matchId={matchId} />


    {/* HIGHLIGHT TIMELINE */}

    <HighlightTimeline matchId={matchId} />


    {/* TIMELINE SCRUBBER */}

    <MatchTimelineSlider matchId={matchId} />


    {/* LIVE MATCH TABS */}

    <TabsArea match={match} />


    {/* OVERLAYS */}

    <TacticalOverlay />

    {showReplay && (
      <ReplayOverlay
        matchId={matchId}
        onClose={() => setShowReplay(false)}
      />
    )}

     {/* DEV BROADCAST TOOLS */}
    {process.env.NODE_ENV === "development" && (
      <div className="mt-12 border-t border-gray-700 pt-6 space-y-4">
        <BroadcastDirectorPanel />
        <BroadcastControlDashboard />
      </div>
    )}

  </div>
);
}
function TabsArea({ match }: { match: Match }) {

  const [activeTab, setActiveTab] = useState("live");

  

  return (
    <>
      <div className="flex gap-6 border-b pb-2">
        <button onClick={() => setActiveTab("info")}>Info</button>
        <button onClick={() => setActiveTab("live")}>Live</button>
        <button onClick={() => setActiveTab("scorecard")}>Scorecard</button>
        <button onClick={() => setActiveTab("overs")}>Overs</button>
        <button onClick={() => setActiveTab("highlights")}>Highlights</button>
        <button onClick={() => setActiveTab("admin")}>Admin</button>
      </div>

      {activeTab === "info" && <div>Match Info Coming Soon...</div>}
      {activeTab === "live" && <BroadcastLiveView match={match} />}
      {activeTab === "scorecard" && <div>Scorecard View Coming Soon...</div>}

      <div className={activeTab === "overs" ? "block" : "hidden"}>
        <OversTimeline slug={match.slug} />
      </div>

      {activeTab === "highlights" && <div>Highlights Coming Soon...</div>}

      {activeTab === "admin" && (
        <AdminScoringPanel matchId={match.slug} />
      )}
    </>
  );
}