import { getMomentumTimeline } from "./momentumTimelineEngine";
import { getWinProbabilityTimeline } from "./winProbabilityTimelineEngine";

type Insight = {
  type: string;
  text: string;
};

const insightStore: Record<string, Insight[]> = {};

export function generateAIInsights(matchId: string) {

  const insights: Insight[] = [];

  /*
  ========================================
  Momentum Swing Detection
  ========================================
  */

  const momentumTimeline = getMomentumTimeline(matchId);

  const lastMomentum =
    momentumTimeline[momentumTimeline.length - 1];

  const prevMomentum =
    momentumTimeline[momentumTimeline.length - 2];

  if (
    typeof lastMomentum === "number" &&
    typeof prevMomentum === "number"
  ) {

    const swing = Math.abs(lastMomentum - prevMomentum);

    if (swing >= 6) {

      insights.push({
        type: "momentum_swing",
        text: "Massive momentum swing detected"
      });

    }

  }

  /*
  ========================================
  Win Probability Swing Detection
  ========================================
  */

  const winProbState = getWinProbabilityTimeline(matchId);

  const timeline = winProbState.timeline ?? [];

  const last = timeline[timeline.length - 1];
  const prev = timeline[timeline.length - 2];

  if (last && prev) {

    const diff = Math.abs(last.batting - prev.batting);

    if (diff >= 15) {

      insights.push({
        type: "winprob_shift",
        text: "Win probability swing exceeds 15%"
      });

    }

  }

  insightStore[matchId] = insights;

}

export function getAIInsights(matchId: string) {

  return insightStore[matchId] ?? [];

}