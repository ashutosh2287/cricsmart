"use client";

import { useEffect, useState } from "react";
import { subscribeMatch } from "@/services/matchEngine";

import { composeFullMatchStory } from "@/services/story/matchStoryComposer";
import { generateMatchStory } from "@/services/story/matchStoryEngine";
import { getLiveMatchStory } from "@/services/story/liveMatchStoryEngine";
import { MatchStory as MatchStoryType } from "@/services/story/matchStoryEngine";

import { getPlayerOfMatch } from "@/services/analytics/playerOfMatchEngine";
import { TrendingDown, TrendingUp, AlertCircle, Sparkles, AlertTriangle } from "lucide-react";
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
    <div className="bg-[var(--surface)] text-[var(--text-1)] p-4 rounded-xl space-y-4">

      {/* 🔥 TITLE */}
      <h2 className="font-bold text-lg">Match Story</h2>

{/* 🏆 PLAYER OF MATCH */}
{pom && (
  <div className="text-[var(--amber)] text-sm bg-[var(--surface-3)] px-3 py-2 rounded-md border border-[var(--border)]">
    🏆 Player of the Match: <span className="font-semibold">{pom}</span>
  </div>
)}

      {/* ⚡ LIVE STORY */}
      {liveStory && (
        <div className="bg-[var(--surface-3)] p-3 rounded-lg border border-[var(--border)]">
          <p className="text-xs text-[var(--text-2)] mb-1 uppercase tracking-wide">
            Live Narrative
          </p>
          <p className="text-sm text-[var(--amber)] leading-relaxed">
            {liveStory}
          </p>
        </div>
      )}

      {/* 📖 FINAL STORY */}
      <div>
        <p className="text-xs text-[var(--text-2)] mb-1 uppercase tracking-wide">
          Full Match Story
        </p>
        <p className="text-sm text-[var(--text-2)] leading-relaxed">
          {story}
        </p>
      </div>

      {/* 📊 INSIGHTS */}
      {insights && (
        <div className="space-y-2 border-t border-[var(--border)] pt-3">

          <p className="text-xs text-[var(--text-2)] uppercase tracking-wide">
            Key Insights
          </p>

          {insights.turningPoint && (
            <div className="flex items-start gap-1.5 text-sm text-[var(--danger)]">
              <TrendingDown className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{insights.turningPoint}</span>
            </div>
          )}

          {insights.partnership && (
            <div className="flex items-start gap-1.5 text-sm text-[var(--success)]">
              <TrendingUp className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{insights.partnership}</span>
            </div>
          )}

          {insights.bestMoment && (
            <div className="flex items-start gap-1.5 text-sm text-[var(--brand)]">
              <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{insights.bestMoment}</span>
            </div>
          )}

          {insights.collapsePhase && (
            <div className="flex items-start gap-1.5 text-sm text-[var(--amber)]">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{insights.collapsePhase}</span>
            </div>
          )}

          {insights.deathDrama && (
            <div className="flex items-start gap-1.5 text-sm text-[var(--accent-brand)]">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{insights.deathDrama}</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}