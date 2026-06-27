"use client";

import { getMatchPrediction } from "@/services/prediction/matchPredictorEngine";
import { Sparkles, TrendingUp, TrendingDown, Target } from "lucide-react";

export default function MatchPredictionPanel({ matchId }: { matchId: string }) {

  const prediction = getMatchPrediction(matchId);

  if (!prediction) return null;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text-1)] p-5 rounded-xl space-y-4">

      {/* AI Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI Match Prediction</h3>
          <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Powered by ML Model</p>
        </div>
      </div>

      {/* Projected Score - Hero metric */}
      <div className="bg-[var(--surface-3)] rounded-lg p-4 text-center">
        <p className="text-[10px] text-[var(--text-3)] uppercase tracking-wider mb-1">Projected Score</p>
        <p className="text-3xl font-bold font-mono tabular-nums text-[var(--brand)]">{prediction.projectedScore}</p>
      </div>

      {/* Range */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--surface-3)] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-[var(--success)]" />
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Best Case</span>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-[var(--success)]">{prediction.bestCaseScore}</p>
        </div>
        <div className="bg-[var(--surface-3)] rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3 h-3 text-[var(--danger)]" />
            <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">Worst Case</span>
          </div>
          <p className="text-lg font-bold font-mono tabular-nums text-[var(--danger)]">{prediction.worstCaseScore}</p>
        </div>
      </div>

      {/* Run Rates */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-2)]">Current RR</span>
        <span className="font-mono tabular-nums font-medium">{prediction.currentRunRate.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-2)]">Projected RR</span>
        <span className="font-mono tabular-nums font-medium">{prediction.projectedRunRate.toFixed(2)}</span>
      </div>

      {/* Model note */}
      <p className="text-[10px] text-[var(--text-3)] pt-2 border-t border-[var(--border)]">
        Predictions update ball-by-ball based on match conditions
      </p>
    </div>
  );
}
