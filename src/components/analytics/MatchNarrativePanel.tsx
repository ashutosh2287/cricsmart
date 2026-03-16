"use client";

import { generateMatchNarrative } from "@/services/analytics/matchNarrativeEngine";

export default function MatchNarrativePanel({ matchId }: { matchId: string }) {

  const narrative = generateMatchNarrative(matchId);

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">

      <h2 className="text-sm text-gray-400 uppercase mb-3">
        AI Match Insight
      </h2>

      <p className="text-sm text-gray-200">
        {narrative}
      </p>

    </div>

  );
}