"use client";

import { getMatchInsights } from "@/services/analytics/matchInsightsEngine";

type Props = {
  matchId: string;
};

export default function MatchInsightsPanel({ matchId }: Props) {

  const insights = getMatchInsights(matchId);

  return (

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

  );

}