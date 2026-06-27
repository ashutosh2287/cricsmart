"use client";


import { memo, useMemo } from "react";
import { computeTopPerformers } from "@/services/analytics/topPerformersEngine";

function TopPerformersPanel({ matchId }: { matchId: string }) {

  const performers = useMemo(() => computeTopPerformers(matchId), [matchId]);

  return (

    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">

      <h2 className="text-sm text-[var(--text-2)] uppercase mb-4">
        Top Performers
      </h2>

      <div className="space-y-2 text-sm">

        <div>
          Top Scorer: <span className="text-[var(--brand)]">{performers.topScorer}</span>
        </div>

        <div>
          Best Bowler: <span className="text-[var(--brand)]">{performers.topBowler}</span>
        </div>

        <div>
          Best Strike Rate: <span className="text-[var(--brand)]">{performers.bestStrikeRate}</span>
        </div>

      </div>

    </div>

  );
}

const MemoizedTopPerformersPanel = memo(TopPerformersPanel);

MemoizedTopPerformersPanel.displayName = "TopPerformersPanel";

export default MemoizedTopPerformersPanel;