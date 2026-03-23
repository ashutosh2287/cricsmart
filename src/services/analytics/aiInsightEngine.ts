import { getMomentumTimeline } from "./momentumTimelineEngine";
import { getWinProbabilityTimeline } from "./winProbabilityTimelineEngine";
import { getMatchState } from "../matchEngine";

type Insight = {
  type: string;
  text: string;
};

const insightStore: Record<string, Insight[]> = {};

export function generateAIInsights(matchId: string) {
  const insights: Insight[] = [];

  const state = getMatchState(matchId);

  if (!state) {
    insightStore[matchId] = [];
    return;
  }

  const innings = state.innings[state.currentInningsIndex];

  const runs = innings?.runs ?? 0;
  const wickets = innings?.wickets ?? 0;

  /*
  ========================================
  Momentum Swing Detection
  ========================================
  */

  const momentumTimeline = getMomentumTimeline(matchId);

  if (momentumTimeline.length >= 2) {
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
          text:
            lastMomentum > prevMomentum
              ? `Batting side gaining strong momentum (${runs}/${wickets})`
              : `Bowling side pulling the game back (${runs}/${wickets})`
        });
      }
    }
  }

  /*
  ========================================
  Win Probability Swing Detection
  ========================================
  */

  const winProbState = getWinProbabilityTimeline(matchId);

  const timeline = winProbState.timeline ?? [];

  if (timeline.length >= 2) {
    const last = timeline[timeline.length - 1];
    const prev = timeline[timeline.length - 2];

    if (last && prev) {
      const diff = Math.abs(last.batting - prev.batting);

      if (diff >= 15) {
        insights.push({
          type: "winprob_shift",
          text:
            last.batting > prev.batting
              ? "Batting side strengthens grip on match"
              : "Bowling side makes a strong comeback"
        });
      }

      /*
      ========================================
      Turning Point Detection (🔥 Important)
      ========================================
      */

      if (diff >= 25) {
        insights.push({
          type: "turning_point",
          text: "Match turning point! Game direction changing rapidly"
        });
      }
    }
  }

  /*
  ========================================
  Pressure Situation Detection
  ========================================
  */

  if (state.innings.length > 1) {
    const target = state.innings[0].runs + 1;

    const ballsUsed = innings.over * 6 + innings.ball;
    const totalBalls = (state.configOvers ?? 20) * 6;

    const remainingBalls = totalBalls - ballsUsed;
    const remainingRuns = target - runs;

    if (remainingBalls > 0) {
      const requiredRR = (remainingRuns / remainingBalls) * 6;

      if (requiredRR > 10) {
        insights.push({
          type: "high_pressure",
          text: "Required run rate climbing! Pressure on batting side"
        });
      }
    }
  }

  insightStore[matchId] = insights;
}

export function getAIInsights(matchId: string) {
  return insightStore[matchId] ?? [];
}