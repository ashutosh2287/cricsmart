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
import { replayOver } from "@/services/replayController";

export default function MatchDetailPage() {

  const params = useParams();

  /*
  =================================================
  STRICT MATCH ID EXTRACTION
  =================================================
  */

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
  LOAD MATCH DATA
  =================================================
  */

  useEffect(() => {

    if (!matchId) return;

    const id = matchId; // ✅ local narrowed constant

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

    const id = matchId; // ✅ local narrowed constant

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

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          {match.team1} vs {match.team2}
        </h1>

        {currentEngineState && (() => {
  const innings =
    currentEngineState.innings[
      currentEngineState.currentInningsIndex
    ];

  return (
    <div className="text-lg mt-2">
      {innings.runs}/{innings.wickets}{" "}
      ({innings.over}.{innings.ball})
    </div>
  );
})()}

        {currentEngineState && (
          <button
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => {
  const innings =
    currentEngineState.innings[
      currentEngineState.currentInningsIndex
    ];

  replayOver(matchId, innings.over);
  setShowReplay(true);
}}
          >
            Replay Last Over
          </button>
        )}
      </div>

      <TabsArea match={match} />

      {showReplay && (
        <ReplayOverlay
          matchId={matchId}
          onClose={() => setShowReplay(false)}
        />
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