"use client";

import { useEffect, useState } from "react";
import {
  getMatchState,
  subscribeMatch,
  MatchState
} from "@/services/matchEngine";
import { useParams } from "next/navigation";
import BroadcastLiveView from "@/components/BroadcastLiveView";
import { enableBroadcast, disableBroadcast } from "@/services/broadcastMode";
import { Match } from "@/types/match";
import OversTimeline from "@/components/OversTimeline";
import { getMatchBySlug } from "@/services/matchService";

export default function MatchDetailPage() {

  const { slug } = useParams();
  const matchId = slug as string;

  const [match, setMatch] = useState<Match | undefined>();
  
  // ✅ Properly typed state
  const [engineState, setEngineState] = useState<MatchState | undefined>(() =>
    getMatchState(matchId)
  );

  // Load static match info
  useEffect(() => {

    async function loadMatch() {
      const m = await getMatchBySlug(matchId);
      setMatch(m);
    }

    loadMatch();

  }, [matchId]);

  // Enable broadcast mode
  useEffect(() => {

    enableBroadcast();

    return () => {
      disableBroadcast();
    };

  }, []);

  // Subscribe to engine updates
  useEffect(() => {

    const unsubscribe = subscribeMatch(matchId, () => {
  setEngineState(getMatchState(matchId));
});
    return unsubscribe;

  }, [matchId]);

  if (!match) {
    return <div className="p-6">Match not found</div>;
  }

  return (
    <div className="p-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold">
          {match.team1} vs {match.team2}
        </h1>

        {engineState && (
          <div className="text-lg mt-2">
            {engineState.runs}/{engineState.wickets}
            {" "}
            ({engineState.over}.{engineState.ball})
          </div>
        )}
      </div>

      <TabsArea match={match} />

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
      </div>

      {activeTab === "info" && <div>Match Info Coming Soon...</div>}
      {activeTab === "live" && <BroadcastLiveView match={match} />}
      {activeTab === "scorecard" && <div>Scorecard View Coming Soon...</div>}
      {activeTab === "overs" && <OversTimeline slug={match.slug} />}
      {activeTab === "highlights" && <div>Highlights Coming Soon...</div>}
    </>
  );
}