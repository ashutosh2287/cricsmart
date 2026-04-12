import { getMatchState, getEventStream } from "./matchEngine";
import { computeWinProbability } from "./winProbabilityEngine";
import { computeMomentumContext } from "./momentumContextEngine";

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

  /*
  ============================================
  🔥 CONTEXT ADJUSTMENT
  ============================================
  */

  score += momentum.score * 0.2;

  if (momentum.arc === "SURGE") score += 8;
  if (momentum.arc === "COLLAPSE") score -= 12;
  if (momentum.arc === "STALL") score -= 5;

  /*
  ============================================
  🔥 PHASE BOOST (DEATH OVERS)
  ============================================
  */

  const innings = state.innings[state.currentInningsIndex];
  const over = innings?.over ?? 0;

  if (over >= 15) {
    score += momentum.score * 0.1; // more impact in death
  }

  return Math.max(0, Math.min(100, score));
}