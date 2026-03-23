"use client";

import { useEffect, useState } from "react";
import { getMatchInsights } from "@/services/analytics/matchInsightsEngine";
import { getAIInsights } from "@/services/analytics/aiInsightEngine";
import MomentumChart from "./MomentumChart";

type Props = {
  matchId: string;
};
type MatchInsight = {
  text: string;
};

type AIInsight = {
  type: string;
  text: string;
};

export default function MatchInsightsPanel({ matchId }: Props) {

  const [insights, setInsights] = useState<MatchInsight[]>([]);
  const [aiInsights, setAIInsights] = useState<AIInsight[]>();

  // 🔥 LIVE UPDATE (IMPORTANT)
  useEffect(() => {

    const interval = setInterval(() => {
      setInsights(getMatchInsights(matchId));
      setAIInsights(getAIInsights(matchId) ?? []);
    }, 1000); // update every second

    return () => clearInterval(interval);

  }, [matchId]);

  return (

    <div className="space-y-6">

      {/* 📊 MOMENTUM + WIN PROB */}
      <MomentumChart matchId={matchId} />

      {/* 🤖 AI INSIGHTS (PREMIUM CARD) */}
      {(aiInsights?.length ?? 0) > 0 && (

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 
                        border border-purple-600 rounded-xl p-4 shadow-lg">

          <h3 className="text-xs text-purple-300 uppercase mb-3 tracking-wide">
            🤖 AI Insights
          </h3>

          <div className="space-y-2">

            {aiInsights?.slice(-3).map((insight, i) => (

              <div
                key={i}
                className="text-sm text-purple-200 bg-purple-950/40 
                           px-3 py-2 rounded-md border border-purple-700"
              >
                {insight.text}
              </div>

            ))}

          </div>

        </div>

      )}

      {/* ⚡ MATCH INSIGHTS */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">

        <h3 className="text-xs text-gray-400 uppercase mb-3 tracking-wide">
          ⚡ Match Insights
        </h3>

        {insights.length === 0 && (
          <div className="text-gray-500 text-sm">
            No insights yet
          </div>
        )}

        <div className="space-y-2">

          {insights.slice(-5).map((i, index) => (

            <div
              key={index}
              className="text-sm text-gray-300 flex items-start gap-2"
            >
              <span className="text-green-400">•</span>
              <span>{i.text}</span>
            </div>

          ))}

        </div>

      </div>

    </div>

  );
}