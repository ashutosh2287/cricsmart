"use client";

import { getMatchState, subscribeMatch } from "@/services/matchEngine";
import { useEffect, useState } from "react";

export default function LiveScoreCard({ matchId }: { matchId: string }) {

  const [state, setState] = useState(getMatchState(matchId));

  useEffect(() => {

    const unsub = subscribeMatch(matchId, () => {
      setState({ ...getMatchState(matchId)! });
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