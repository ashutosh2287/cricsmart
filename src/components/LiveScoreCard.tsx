"use client";

import {
  getMatchSnapshot,
  subscribeMatch,
} from "@/lib/eventStore";

import { useEffect, useState } from "react";
import type { MatchState } from "@/services/matchEngine";

export default function LiveScoreCard({ matchId }: { matchId: string }) {
  const [state, setState] = useState<MatchState | null>(
    getMatchSnapshot(matchId)
  );

  useEffect(() => {
    const unsub = subscribeMatch(matchId, () => {
      const next = getMatchSnapshot(matchId);
      if (next) {
        setState({ ...next });
      }
    });

    return unsub;
  }, [matchId]);

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