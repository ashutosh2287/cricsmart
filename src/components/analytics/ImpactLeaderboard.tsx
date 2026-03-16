"use client";

import { getPlayerStats } from "@/services/analytics/playerStatsEngine";
import { getPlayerImpact } from "@/services/analytics/playerImpactEngine";

export default function ImpactLeaderboard({ matchId }: { matchId: string }) {

  const stats = getPlayerStats(matchId);

  const leaderboard = Object.keys(stats)
    .map(player => ({
      player,
      impact: getPlayerImpact(matchId, player)
    }))
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">

      <h2 className="text-sm text-gray-400 uppercase mb-4">
        Player Impact Leaderboard
      </h2>

      <div className="space-y-2 text-sm">

        {leaderboard.map((p, i) => (

          <div key={p.player} className="flex justify-between">

            <span>
              {i + 1}. {p.player}
            </span>

            <span className="text-blue-400">
              {p.impact.toFixed(1)}
            </span>

          </div>

        ))}

      </div>

    </div>

  );
}