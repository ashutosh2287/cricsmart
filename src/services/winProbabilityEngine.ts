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

  // Only limited overs chase
  if (state.configOvers === null) return null;
  if (state.innings.length < 2) return null;

  const chase = computeChasePressure(state);
  if (!chase) return null;

  const second = state.innings[1];

  const wicketsRemaining = 10 - second.wickets;

  const rrrGap =
    chase.currentRunRate - chase.requiredRunRate;

  const ballsFactor =
    chase.ballsRemaining / (state.configOvers * 6);

  const wicketFactor =
    wicketsRemaining / 10;

  // Weighted deterministic score
  const x =
    rrrGap * 1.5 +
    ballsFactor * 1.2 +
    wicketFactor * 0.8;

  const probability = logistic(x);

  const battingWinProbability =
    Math.max(0, Math.min(100, probability * 100));

  return {
    battingWinProbability,
    bowlingWinProbability:
      100 - battingWinProbability
  };
}