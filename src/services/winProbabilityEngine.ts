import { MatchState } from "./matchEngine";
import { computeChasePressure } from "./pressureEngine";

/* =============================
   TYPES
============================= */

export type WinProbabilityContext = {
  battingWinProbability: number;
  bowlingWinProbability: number;
};

/* =============================
   HELPERS
============================= */

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/* =============================
   MAIN ENGINE
============================= */

export function computeWinProbability(
  state: MatchState
): WinProbabilityContext | null {

  if (state.configOvers === null) return null;

  const totalBalls = state.configOvers * 6;

  /* =========================================
     1️⃣ FIRST INNINGS
  ========================================= */

  if (state.currentInningsIndex === 0) {

    const innings = state.innings[0];

    const ballsBowled =
      innings.over * 6 + innings.ball;

    const progress = ballsBowled / totalBalls;

    const wicketsFactor = innings.wickets / 10;

    // Simple par score model
    const expectedRuns = progress * 160;

    const runFactor =
      (innings.runs - expectedRuns) / 100;

    let probability =
      0.5 +
      runFactor * 0.6 -
      wicketsFactor * 0.3;

    probability = Math.max(0.2, Math.min(0.8, probability));

    const battingWinProbability = probability * 100;

    return {
      battingWinProbability,
      bowlingWinProbability: 100 - battingWinProbability
    };
  }

  /* =========================================
     2️⃣ SECOND INNINGS (CHASE)
  ========================================= */

  const chase = computeChasePressure(state);
  if (!chase) return null;

  const second = state.innings[1];

  const wicketsRemaining = 10 - second.wickets;

  const rrrGap =
    chase.currentRunRate - chase.requiredRunRate;

  const ballsFactor =
    chase.ballsRemaining / totalBalls;

  const wicketFactor =
    wicketsRemaining / 10;

  const pressureFactor =
    chase.pressureIndex / 100;

  let x =
    rrrGap * 1.2 +
    ballsFactor * 0.8 +
    wicketFactor * 0.6 -
    pressureFactor * 0.8;

  // Soft late game boost
  if (chase.ballsRemaining <= 12) {
    x *= 1.2;
  }

  const probability = logistic(x);

  const battingWinProbability =
    Math.max(5, Math.min(95, probability * 100));

  return {
    battingWinProbability,
    bowlingWinProbability: 100 - battingWinProbability
  };
}