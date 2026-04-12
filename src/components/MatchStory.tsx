"use client";

import { useEffect, useState } from "react";
import { subscribeMatch } from "@/services/matchEngine";

import { composeFullMatchStory } from "@/services/story/matchStoryComposer";
import { generateMatchStory } from "@/services/story/matchStoryEngine";
import { getLiveMatchStory } from "@/services/story/liveMatchStoryEngine"; // 🔥 NEW
import { MatchStory as MatchStoryType } from "@/services/story/matchStoryEngine";

import { getPlayerOfMatch } from "@/services/analytics/playerOfMatchEngine";
type Props = {
  matchId: string;
};

export default function MatchStory({ matchId }: Props) {

  const [story, setStory] = useState("");
  const [liveStory, setLiveStory] = useState("");
  const [insights, setInsights] = useState<MatchStoryType | null>(null);
  const pom = getPlayerOfMatch(matchId);
  

  /* =============================
     🔄 LIVE UPDATE
  ============================= */
  useEffect(() => {

    function update() {
      setStory(composeFullMatchStory(matchId));
      setLiveStory(getLiveMatchStory(matchId));
      setInsights(generateMatchStory(matchId));
    }

    update();

    const unsubscribe = subscribeMatch(matchId, update);

    return () => unsubscribe();

  }, [matchId]);

  if (!story) return null;

  return (
    <div className="bg-gray-900 text-white p-4 rounded-xl space-y-4">

      {/* 🔥 TITLE */}
      <h2 className="font-bold text-lg">Match Story</h2>

      <h2 className="font-bold text-lg">Match Story</h2>

{/* 🏆 PLAYER OF MATCH */}
{pom && (
  <div className="text-yellow-400 text-sm bg-white/5 px-3 py-2 rounded-md border border-white/10">
    🏆 Player of the Match: <span className="font-semibold">{pom}</span> 
  </div>
)}

      {/* ⚡ LIVE STORY */}
      {liveStory && (
        <div className="bg-white/5 p-3 rounded-lg border border-white/10">
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
            Live Narrative
          </p>
          <p className="text-sm text-yellow-300 leading-relaxed">
            {liveStory}
          </p>
        </div>
      )}

      {/* 📖 FINAL STORY */}
      <div>
        <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
          Full Match Story
        </p>
        <p className="text-sm text-gray-300 leading-relaxed">
          {story}
        </p>
      </div>

      {/* 📊 INSIGHTS */}
      {insights && (
        <div className="space-y-2 border-t border-white/10 pt-3">

          <p className="text-xs text-gray-400 uppercase tracking-wide">
            Key Insights
          </p>

          {insights.turningPoint && (
            <p className="text-sm text-red-400">
              🔴 {insights.turningPoint}
            </p>
          )}

          {insights.partnership && (
            <p className="text-sm text-green-400">
              🟢 {insights.partnership}
            </p>
          )}

          {insights.bestMoment && (
            <p className="text-sm text-blue-400">
              🔵 {insights.bestMoment}
            </p>
          )}

          {insights.collapsePhase && (
            <p className="text-sm text-orange-400">
              ⚠ {insights.collapsePhase}
            </p>
          )}

          {insights.deathDrama && (
            <p className="text-sm text-purple-400">
              ⚡ {insights.deathDrama}
            </p>
          )}

        </div>
      )}

    </div>
  );
}