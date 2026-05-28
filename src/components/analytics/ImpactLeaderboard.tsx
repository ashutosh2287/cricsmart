"use client";


import { memo, useMemo } from "react";
import { getPlayerStats } from "@/services/analytics/playerStatsEngine";
import { getPlayerImpact } from "@/services/analytics/playerImpactEngine";

function ImpactLeaderboard({ matchId }: { matchId: string }) {

  const leaderboard = useMemo(() => {
    const stats = getPlayerStats(matchId);
    return Object.keys(stats)
      .map(player => ({
        player,
        impact: getPlayerImpact(matchId, player)
      }))
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 5);
  }, [matchId]);

  return (

    <div className="bg-[var(--surface)] border border-zinc-800 rounded-xl p-6">

      <h2 className="text-sm text-[var(--text-2)] uppercase mb-4">
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
const MemoizedImpactLeaderboard = memo(ImpactLeaderboard);

MemoizedImpactLeaderboard.displayName = "ImpactLeaderboard";

export default MemoizedImpactLeaderboard;