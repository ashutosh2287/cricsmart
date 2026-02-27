import { computeWinProbability } from "./winProbabilityEngine";
import { MatchState } from "./matchEngine";

type SwingState = {
  lastProbability: number | null;
};

const swingStore: Record<string, SwingState> = {};

export type ProbabilitySwing = {
  delta: number;
  direction: "UP" | "DOWN";
};

export function computeProbabilitySwing(
  matchId: string,
  state: MatchState
): ProbabilitySwing | null {

  const result = computeWinProbability(state);
  if (!result) return null;

  const current = result.battingWinProbability;

  if (!swingStore[matchId]) {
    swingStore[matchId] = { lastProbability: current };
    return null;
  }

  const previous = swingStore[matchId].lastProbability;
  swingStore[matchId].lastProbability = current;

  if (previous === null) return null;

  const delta = current - previous;

  if (Math.abs(delta) < 8) return null;

  return {
    delta,
    direction: delta > 0 ? "UP" : "DOWN"
  };
}