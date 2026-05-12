"use client";

import { memo } from "react";
import { useScore } from "@/services/matchSelectors";

function LiveScoreCard({
  matchId,
}: {
  matchId: string;
}) {
  const score = useScore(matchId);

  return (
    <div className="ui-inset">
      <div className="text-lg font-bold tabular-nums score-tick">
        {score.runs}/{score.wickets}
      </div>

      <div className="text-xs text-gray-400">
        Overs: {score.overs}
      </div>
    </div>
  );
}

const MemoizedLiveScoreCard = memo(LiveScoreCard);

MemoizedLiveScoreCard.displayName = "LiveScoreCard";


export default MemoizedLiveScoreCard;
