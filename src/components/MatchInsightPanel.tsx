"use client";

import { useEffect, useState } from "react";
import { subscribeMatch } from "@/services/matchEngine";
import { computeAnalytics } from "@/services/analytics/analyticsEngine";
import { computeProjectedScore } from "@/services/analytics/projectedScoreEngine";
import { computeRequiredRunRate } from "@/services/analytics/requiredRunRateEngine";
import { getWinProbabilityTimeline } from "@/services/analytics/winProbabilityTimelineEngine";
import { getPatternInsights } from "@/services/analytics/patternDetectionEngine";
import { getSituationInsights } from "@/services/analytics/matchSituationEngine";
import { SituationInsight } from "@/services/analytics/matchSituationEngine";
type Props = {
  matchId: string;
};

type PatternInsight = {
  type: string;
  text: string;
};

export default function MatchInsightPanel({ matchId }: Props) {

  const [runRate, setRunRate] = useState(0);
  const [momentum, setMomentum] = useState(0);
  const [winProb, setWinProb] = useState(50);
  const [projection, setProjection] = useState(0);
  const [rrr, setRRR] = useState(0);

  const [patternInsights, setPatternInsights] =
    useState<PatternInsight[]>([]);

  const [situationInsights, setSituationInsights] =
  useState<SituationInsight[]>([]);

  useEffect(() => {

    function update() {

      const analytics = computeAnalytics(matchId);

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

      const winTimeline = getWinProbabilityTimeline(matchId);

      if (winTimeline.timeline.length) {
        const latest =
          winTimeline.timeline[
            winTimeline.timeline.length - 1
          ];

        setWinProb(latest.batting);
      }

      const proj = computeProjectedScore(matchId);

      if (proj) {
        setProjection(proj.projectedScore);
      }

      const required = computeRequiredRunRate(matchId, 180);

      if (required) {
        setRRR(required.requiredRunRate);
      }

      setSituationInsights(getSituationInsights(matchId));

      // Update Pattern Insights
      const patterns = getPatternInsights(matchId);
      setPatternInsights(patterns);

    }

    update();

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  return (
    <div className="bg-zinc-900 text-white p-4 rounded-xl shadow-lg">

      {/* Pattern Insights */}

      {patternInsights.length > 0 && (

        <div className="mb-4 space-y-1">

          {situationInsights.map((s, i) => (

  <div key={i} className="text-sm text-yellow-400">
    ⚠ {s.text}
  </div>

))}

          {patternInsights.map((p, i) => (

            <div key={i} className="text-sm text-orange-400">
              ⚡ {p.text}
            </div>

          ))}

        </div>

      )}

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