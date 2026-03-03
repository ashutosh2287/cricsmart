import { MatchState } from "./matchEngine";
import { computeChasePressure } from "./pressureEngine";

export type WinProbabilityContext = {
  battingWinProbability: number; // 0–100
  bowlingWinProbability: number; // 0–100
};

function logistic(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function computeWinProbability(
  state: MatchState
): WinProbabilityContext | null {

  // Limited overs only
  if (state.configOvers === null) return null;
  if (state.innings.length < 2) return null;

  const chase = computeChasePressure(state);
  if (!chase) return null;

  const second = state.innings[1];

  const wicketsRemaining = 10 - second.wickets;

  // Positive means batting side ahead
  const rrrGap =
    chase.currentRunRate - chase.requiredRunRate;

  const totalBalls = state.configOvers * 6;

  const ballsFactor =
    chase.ballsRemaining / totalBalls;

  const wicketFactor =
    wicketsRemaining / 10;

  // Normalize pressure (0–1)
  const pressureFactor =
    chase.pressureIndex / 100;

  // Late game amplification
  const lateGameBoost =
    chase.ballsRemaining <= 12 ? 1.4 :
    chase.ballsRemaining <= 24 ? 1.25 :
    chase.ballsRemaining <= 48 ? 1.1 :
    1;

  // Improved deterministic score model
  const x =
    rrrGap * 2.0 +                 // run rate gap more influential
    ballsFactor * 1.3 +            // time remaining
    wicketFactor * 1.0 -           // wickets in hand
    pressureFactor * 1.2;          // high pressure reduces batting edge

  const adjustedX = x * lateGameBoost;

  const probability = logistic(adjustedX);

  const battingWinProbability =
    Math.max(0, Math.min(100, probability * 100));

  return {
    battingWinProbability,
    bowlingWinProbability:
      100 - battingWinProbability
  };
}