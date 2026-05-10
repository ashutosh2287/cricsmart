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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="text-xl font-bold">
        {score.runs}/{score.wickets}
      </div>

      <div className="text-sm text-gray-400">
        Overs: {score.overs}
      </div>
    </div>
  );
}

const MemoizedLiveScoreCard = memo(LiveScoreCard);

MemoizedLiveScoreCard.displayName = "LiveScoreCard";
// @ts-expect-error whyDidYouRender debug flag
MemoizedLiveScoreCard.whyDidYouRender = true;

export default MemoizedLiveScoreCard;
