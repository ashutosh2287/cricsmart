import { getMatchState } from "./matchEngine";
import { computeWinProbability } from "./winProbabilityEngine";
import { computeMomentumContext } from "./momentumContextEngine";
import { getEventStream } from "./matchEngine";

export function computeMomentumMeter(matchId: string) {

  const state = getMatchState(matchId);
  if (!state) return 50;

  let score = 50;

  const probability = computeWinProbability(state);

  if (probability) {
    score = probability.battingWinProbability;
  }

  const events = getEventStream(matchId);
  const momentum = computeMomentumContext(events);

  if (momentum.arc === "SURGE") score += 10;
  if (momentum.arc === "COLLAPSE") score -= 10;

  return Math.max(0, Math.min(100, score));
}