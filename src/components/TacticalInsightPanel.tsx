"use client";

import { getTacticalInsights } from "@/services/tactical/tacticalInsightEngine";

export default function TacticalInsightPanel({ matchId }: { matchId: string }) {

  const insights = getTacticalInsights(matchId);

  if (!insights.length) return null;

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg space-y-3">

      <h3 className="font-bold text-lg">
        Tactical Insights
      </h3>

      {insights.map((i, idx) => (

        <div
          key={idx}
          className={`p-3 rounded ${
            i.severity === "HIGH"
              ? "bg-red-700"
              : i.severity === "MEDIUM"
              ? "bg-yellow-600"
              : "bg-blue-600"
          }`}
        >
          <div className="text-xs font-semibold">{i.type}</div>
          <div className="text-sm">{i.message}</div>
        </div>

      ))}

    </div>
  );
}