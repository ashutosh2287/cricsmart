"use client";

import { computeTopPerformers } from "@/services/analytics/topPerformersEngine";

export default function TopPerformersPanel({ matchId }: { matchId: string }) {

  const performers = computeTopPerformers(matchId);

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">

      <h2 className="text-sm text-gray-400 uppercase mb-4">
        Top Performers
      </h2>

      <div className="space-y-2 text-sm">

        <div>
          Top Scorer: <span className="text-blue-400">{performers.topScorer}</span>
        </div>

        <div>
          Best Bowler: <span className="text-blue-400">{performers.topBowler}</span>
        </div>

        <div>
          Best Strike Rate: <span className="text-blue-400">{performers.bestStrikeRate}</span>
        </div>

      </div>

    </div>

  );
}