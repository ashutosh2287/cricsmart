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
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <div className="text-xl font-bold font-mono tabular-nums">
        {score.runs}/{score.wickets}
      </div>

      <div className="text-sm text-[var(--text-2)] mt-1">
        Overs: {score.overs}
      </div>
    </div>
  );
}

const MemoizedLiveScoreCard = memo(LiveScoreCard);

MemoizedLiveScoreCard.displayName = "LiveScoreCard";


export default MemoizedLiveScoreCard;