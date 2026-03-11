"use client";

import { useEffect, useState } from "react";
import { subscribeMatch, getMatchState } from "@/services/matchEngine";
import { computeAnalytics } from "@/services/analytics/analyticsEngine";
import { computeProjectedScore } from "@/services/analytics/projectedScoreEngine";
import { computeRequiredRunRate } from "@/services/analytics/requiredRunRateEngine";
import { computeWinProbability } from "@/services/winProbabilityEngine";
type Props = {
  matchId: string;
};

export default function MatchInsightPanel({ matchId }: Props) {

  const [runRate, setRunRate] = useState<number>(0);
  const [momentum, setMomentum] = useState<number>(0);
  const [winProb, setWinProb] = useState<number>(50);
  const [projection, setProjection] = useState<number>(0);
  const [rrr, setRRR] = useState<number>(0);

  useEffect(() => {

  function update() {

    const state = getMatchState(matchId);
    if (!state) return;

    const analytics = computeAnalytics(matchId);
    const win = computeWinProbability(state);

    if (analytics.runRate.length) {
      setRunRate(
        analytics.runRate[analytics.runRate.length - 1]
      );
    }

    if (analytics.momentum.length) {
      setMomentum(
        analytics.momentum[analytics.momentum.length - 1]
      );
    }

    if (win) {
      setWinProb(win.battingWinProbability);
    }
    const proj = computeProjectedScore(matchId);

if (proj) {
  setProjection(proj.projectedScore);
}
const required = computeRequiredRunRate(matchId, 180);

if (required) {
  setRRR(required.requiredRunRate);
}

  }

  update();

  const unsubscribe = subscribeMatch(matchId, update);

  return () => {
    unsubscribe();
  };

}, [matchId]);

  return (
    <div className="bg-zinc-900 text-white p-4 rounded-xl shadow-lg">

      <h3 className="text-lg font-semibold mb-3">
        Match Insights
      </h3>

      <div className="space-y-2 text-sm">

        <div className="flex justify-between">
          <span>Win Probability</span>
          <span>{winProb.toFixed(1)}%</span>
        </div>

        <div className="flex justify-between">
          <span>Momentum</span>
          <span>{momentum.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>Run Rate</span>
          <span>{runRate.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span>Projected Score</span>
          <span>{projection}</span>
        </div>

        <div className="flex justify-between">
  <span>Required Run Rate</span>
  <span>{rrr.toFixed(2)}</span>
</div>

      </div>

    </div>
  );
}