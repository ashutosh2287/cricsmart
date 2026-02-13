"use client";

import { useEffect, useState } from "react";
import { getMatches, subscribeStore } from "@/store/realtimeStore";
import { useParams } from "next/navigation";
import BroadcastLiveView from "@/components/BroadcastLiveView";
import { enableBroadcast, disableBroadcast } from "@/services/broadcastMode";
import { Match } from "@/types/match";

export default function MatchDetailPage() {

  const { slug } = useParams();

  const [match, setMatch] = useState<Match | undefined>(
    getMatches().find(m => m.slug === slug)
  );

  // ✅ Match internal tab system
  const [activeTab, setActiveTab] = useState("live");

  // ✅ Enable broadcast mode ONLY in match page
  useEffect(() => {

    enableBroadcast();

    return () => {
      disableBroadcast();
    };

  }, []);

  // ✅ Realtime store subscription
  useEffect(() => {

    const unsubscribe = subscribeStore(() => {

      const updated = getMatches().find(m => m.slug === slug);

      if (updated) {
        setMatch(updated);
      }

    });

    return unsubscribe;

  }, [slug]);

  if (!match) {
    return <div className="p-6">Match not found</div>;
  }

  return (
    <div className="p-6 space-y-6">

      {/* ✅ MATCH HEADER */}
      <div>
        <h1 className="text-2xl font-bold">
          {match.team1} vs {match.team2}
        </h1>
      </div>

      {/* ✅ MATCH TABS */}
      <div className="flex gap-6 border-b pb-2">

        <button onClick={() => setActiveTab("info")}>
          Info
        </button>

        <button onClick={() => setActiveTab("live")}>
          Live
        </button>

        <button onClick={() => setActiveTab("scorecard")}>
          Scorecard
        </button>

        <button onClick={() => setActiveTab("overs")}>
          Overs
        </button>

        <button onClick={() => setActiveTab("highlights")}>
          Highlights
        </button>

      </div>

      {/* ✅ TAB CONTENT AREA */}

      {activeTab === "info" && (
        <div>Match Info Coming Soon...</div>
      )}

      {activeTab === "live" && (
        <BroadcastLiveView match={match} />
      )}

      {activeTab === "scorecard" && (
        <div>Scorecard View Coming Soon...</div>
      )}

      {activeTab === "overs" && (
        <div>Ball by Ball Overs View Coming Soon...</div>
      )}

      {activeTab === "highlights" && (
        <div>Highlights Coming Soon...</div>
      )}

    </div>
  );

}
