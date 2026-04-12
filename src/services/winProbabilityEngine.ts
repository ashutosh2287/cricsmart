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

function getPhase(over: number) {
  if (over < 6) return "powerplay";
  if (over < 15) return "middle";
  return "death";
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
     1️⃣ FIRST INNINGS (IMPROVED)
  ========================================= */

  if (state.currentInningsIndex === 0) {

    const innings = state.innings[0];

    const ballsBowled =
      innings.over * 6 + innings.ball;

    const progress = ballsBowled / totalBalls;

    const phase = getPhase(innings.over);

    // 🔥 Dynamic par score (instead of fixed 160)
    const basePar =
      state.configOvers === 20 ? 165 :
      state.configOvers === 50 ? 280 : 150;

    const expectedRuns = progress * basePar;

    // 🔥 Phase multiplier
    const phaseMultiplier =
      phase === "powerplay" ? 1.1 :
      phase === "death" ? 1.2 : 1.0;

    const runFactor =
      ((innings.runs - expectedRuns) / basePar) * phaseMultiplier;

    const wicketsFactor =
      (innings.wickets / 10) *
      (phase === "death" ? 1.3 : 1.0);

    let probability =
      0.5 +
      runFactor * 0.9 -
      wicketsFactor * 0.5;

    probability = Math.max(0.15, Math.min(0.85, probability));

    const battingWinProbability = probability * 100;

    return {
      battingWinProbability,
      bowlingWinProbability: 100 - battingWinProbability
    };
  }

  /* =========================================
     2️⃣ SECOND INNINGS (CHASE - ADVANCED)
  ========================================= */

  const chase = computeChasePressure(state);
  if (!chase) return null;

  const second = state.innings[1];

  const wicketsRemaining = 10 - second.wickets;
  const phase = getPhase(second.over);

  // 🔥 RRR pressure gap (more realistic)
  const rrrGap =
    (chase.requiredRunRate - chase.currentRunRate);

  // 🔥 Balls importance increases in death overs
  const ballsFactor =
    (chase.ballsRemaining / totalBalls) *
    (phase === "death" ? 1.4 : 1.0);

  // 🔥 Wickets more valuable in chase end
  const wicketFactor =
    (wicketsRemaining / 10) *
    (phase === "death" ? 1.5 : 1.0);

  // 🔥 Pressure normalized
  const pressureFactor =
    chase.pressureIndex / 100;

  // 🔥 Target difficulty scaling
  const targetDifficulty =
    chase.target > 180 ? 1.1 :
    chase.target < 140 ? 0.9 : 1.0;

  let x =
    -rrrGap * 1.4 +          // higher RRR hurts more
    ballsFactor * 0.9 +
    wicketFactor * 0.8 -
    pressureFactor * 1.1;

  x *= targetDifficulty;

  // 🔥 Clutch moment boost
  if (chase.ballsRemaining <= 12) {
    x *= 1.3;
  }

  const probability = logistic(x);

  const battingWinProbability =
    Math.max(3, Math.min(97, probability * 100));

  return {
    battingWinProbability,
    bowlingWinProbability: 100 - battingWinProbability
  };
}