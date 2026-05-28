"use client";

import { getMatchPrediction } from "@/services/prediction/matchPredictorEngine";

export default function MatchPredictionPanel({ matchId }: { matchId: string }) {

  const prediction = getMatchPrediction(matchId);

  if (!prediction) return null;

  return (
    <div className="bg-[var(--surface)] text-[var(--text-1)] p-4 rounded-lg space-y-3">

      <h3 className="text-lg font-bold">
        Match Prediction
      </h3>

      <div className="text-sm">
        Projected Score: <b>{prediction.projectedScore}</b>
      </div>

      <div className="text-sm">
        Best Case: <b>{prediction.bestCaseScore}</b>
      </div>

      <div className="text-sm">
        Worst Case: <b>{prediction.worstCaseScore}</b>
      </div>

      <div className="text-sm">
        Current Run Rate: {prediction.currentRunRate.toFixed(2)}
      </div>

      <div className="text-sm">
        Projected Run Rate: {prediction.projectedRunRate.toFixed(2)}
      </div>

    </div>
  );
}