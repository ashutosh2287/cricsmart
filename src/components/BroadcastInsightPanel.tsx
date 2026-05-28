"use client";

import { getBroadcastInsights } from "@/services/broadcast/broadcastInsightEngine";

export default function BroadcastInsightPanel({ matchId }: { matchId: string }) {

  const insights = getBroadcastInsights(matchId);

  if (!insights.length) return null;

  return (
    <div
      className="p-4 rounded-lg space-y-3"
      style={{ background: "var(--surface)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
    >

      <h3 className="text-lg font-bold">
        Broadcast Insights
      </h3>

      {insights.map((i, idx) => (

        <div
          key={idx}
          className={`p-3 rounded text-[var(--text-inv)] ${
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
