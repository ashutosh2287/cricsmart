"use client";

import { getBroadcastInsights } from "@/services/broadcast/broadcastInsightEngine";

export default function BroadcastInsightPanel({ matchId }: { matchId: string }) {

  const insights = getBroadcastInsights(matchId);

  if (!insights.length) return null;

  return (
    <div className="bg-black text-white p-4 rounded-lg space-y-3">

      <h3 className="text-lg font-bold">
        Broadcast Insights
      </h3>

      {insights.map((i, idx) => (

        <div
          key={idx}
          className={`p-3 rounded ${
            i.severity === "HIGH"
              ? "bg-red-600"
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