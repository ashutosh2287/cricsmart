"use client";

import { useMatchState } from "@/hooks/useMatchState";

export default function LiveScoreCard({
  matchId,
}: {
  matchId: string;
}) {
  const state = useMatchState(matchId);

  if (!state) return null;

  const innings = state.innings[state.currentInningsIndex];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="text-xl font-bold">
        {innings.runs}/{innings.wickets}
      </div>

      <div className="text-sm text-gray-400">
        Overs: {innings.over}.{innings.ball}
      </div>
    </div>
  );
}