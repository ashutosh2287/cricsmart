"use client";

import { memo, useMemo } from "react";
import { getGlobalAnalytics } from "@/services/analytics/globalAnalyticsEngine";

function LeaderboardCards() {

  const data = useMemo(() => getGlobalAnalytics(), []);

  const topBatter = useMemo(() => data.topRunScorers[0], [data]);
  const topImpact = useMemo(() => data.topImpactPlayers[0], [data]);

  return (

    <div className="grid grid-cols-3 gap-4">

      {/* TOP BATTER */}

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">

        <h3 className="text-xs text-gray-400 uppercase mb-2">
          Top Batter
        </h3>

        {topBatter ? (
          <>
            <div className="text-lg font-bold">
              {topBatter.playerId}
            </div>
            <div className="text-sm text-gray-400">
              {topBatter.runs} runs
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            No data
          </div>
        )}

      </div>

      {/* TOP IMPACT PLAYER */}

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">

        <h3 className="text-xs text-gray-400 uppercase mb-2">
          Top Impact Player
        </h3>

        {topImpact ? (
          <>
            <div className="text-lg font-bold">
              {topImpact.playerId}
            </div>
            <div className="text-sm text-gray-400">
              Impact {topImpact.impact.toFixed(1)}
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            No data
          </div>
        )}

      </div>

      {/* MATCH CONTROL LEADER */}

      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">

        <h3 className="text-xs text-gray-400 uppercase mb-2">
          Match Control Leader
        </h3>

        {data.matchControlLeader ? (
          <>
            <div className="text-lg font-bold">
              {data.matchControlLeader.matchId}
            </div>
            <div className="text-sm text-gray-400">
              Control {data.matchControlLeader.control.toFixed(0)}%
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            No data
          </div>
        )}

      </div>

    </div>

  );

}

const MemoizedLeaderboardCards = memo(LeaderboardCards);

MemoizedLeaderboardCards.displayName = "LeaderboardCards";

export default MemoizedLeaderboardCards;
