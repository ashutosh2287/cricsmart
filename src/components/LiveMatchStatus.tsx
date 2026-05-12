"use client";

import { useMatchSelector, useScore } from "@/services/matchSelectors";

type Props = {
  matchId: string;
};

export default function LiveMatchStatus({ matchId }: Props) {
  const score = useScore(matchId);
  const inningsIndex = useMatchSelector(
    matchId,
    (state) => state.currentInningsIndex
  );

  return (
    <div className="bg-gradient-to-r from-blue-900/40 via-zinc-900 to-purple-900/40 border border-zinc-800 rounded-xl p-4 shadow-lg">
      <div className="flex flex-wrap gap-6 text-sm text-gray-300">
        
        <div>
          <span className="text-gray-400">Score:</span>{" "}
          <span className="text-white font-semibold">
            {score.runs}/{score.wickets}
          </span>
        </div>

        <div>
          <span className="text-gray-400">Overs:</span>{" "}
          <span className="text-white font-semibold">
            {score.overs}
          </span>
        </div>

        <div>
          <span className="text-gray-400">Innings:</span>{" "}
          <span className="text-white font-semibold">
            {(inningsIndex ?? 0) + 1}
          </span>
        </div>

      </div>
    </div>
  );
}