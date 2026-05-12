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
    <div className="ui-inset">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="inline-flex items-center gap-2 text-white/75">
          <span className="live-pulse-red" />
          LIVE
        </span>
        <span className="text-white/60">Score</span>
        <span className="font-semibold text-white tabular-nums">
          {score.runs}/{score.wickets}
        </span>
        <span className="text-white/60">Overs</span>
        <span className="font-semibold text-white tabular-nums">{score.overs}</span>
        <span className="text-white/60">Innings</span>
        <span className="font-semibold text-white">{(inningsIndex ?? 0) + 1}</span>
      </div>
    </div>
  );
}
