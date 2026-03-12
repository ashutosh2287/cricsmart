import { getEventStream } from "../matchEngine";

export type MatchPrediction = {
  projectedScore: number;
  bestCaseScore: number;
  worstCaseScore: number;
  currentRunRate: number;
  projectedRunRate: number;
};

const predictionStore: Record<string, MatchPrediction> = {};

export function getMatchPrediction(matchId: string) {
  return predictionStore[matchId];
}

export function runMatchPredictor(matchId: string) {

  const events = getEventStream(matchId);

  if (!events.length) return;

  const validBalls = events.filter(
    e => e.valid && e.isLegalDelivery
  );

  const runs = validBalls.reduce(
    (sum, e) => sum + (e.runs ?? 0),
    0
  );

  const wickets = validBalls.filter(
    e => e.wicket
  ).length;

  const balls = validBalls.length;

  /*
  ========================================
  Match Format (default T20)
  ========================================
  */

  const totalBalls = 120;

  const ballsRemaining = Math.max(0, totalBalls - balls);

  const currentRunRate =
    balls > 0 ? (runs / balls) * 6 : 0;

  /*
  ========================================
  Base Projection
  ========================================
  */

  let projectedRunRate = currentRunRate;

  /*
  Wickets slow scoring
  */

  if (wickets >= 5) {
    projectedRunRate *= 0.9;
  }

  if (wickets >= 8) {
    projectedRunRate *= 0.8;
  }

  /*
  Death overs boost
  */

  if (ballsRemaining <= 24) {
    projectedRunRate *= 1.15;
  }

  const projectedRunsRemaining =
    (projectedRunRate / 6) * ballsRemaining;

  const projectedScore =
    Math.round(runs + projectedRunsRemaining);

  /*
  Scenario simulation
  */

  const bestCaseScore =
    Math.round(projectedScore * 1.15);

  const worstCaseScore =
    Math.round(projectedScore * 0.85);

  predictionStore[matchId] = {
    projectedScore,
    bestCaseScore,
    worstCaseScore,
    currentRunRate,
    projectedRunRate
  };

}