"use client";

import { getMatchInsights } from "@/services/analytics/matchInsightsEngine";
import WinProbabilityChart from "./WinProbabilityChart";
import MomentumChart from "./MomentumChart";
import { getAIInsights } from "@/services/analytics/aiInsightEngine";

type Props = {
  matchId: string;
};

export default function MatchInsightsPanel({ matchId }: Props) {

  const insights = getMatchInsights(matchId);
  const aiInsights = getAIInsights(matchId);

  return (

    <div className="space-y-6">

      {/* WIN PROBABILITY + MOMENTUM */}

      <WinProbabilityChart matchId={matchId} />
      <MomentumChart matchId={matchId} />

      {/* AI INSIGHTS */}

      {aiInsights.length > 0 && (

        <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-4">

          <h3 className="text-xs text-purple-300 uppercase mb-3">
            AI Insights
          </h3>

          {aiInsights.map((insight, i) => (

            <div key={i} className="text-sm text-purple-400 mb-1">

              🤖 {insight.text}

            </div>

          ))}

        </div>

      )}

      {/* MATCH INSIGHTS */}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">

        <h3 className="text-xs text-gray-400 uppercase mb-3">
          Match Insights
        </h3>

        {insights.length === 0 && (
          <div className="text-gray-500 text-sm">
            No insights yet
          </div>
        )}

        {insights.map((i, index) => (

          <div
            key={index}
            className="text-sm text-gray-300 mb-2"
          >
            • {i.text}
          </div>

        ))}

      </div>

    </div>

  );

}