// matchDramaEngine.ts

import { computeChasePressure } from "../pressureEngine";
import { computeWinProbability } from "../winProbabilityEngine";
import { computeProbabilitySwing } from "../probabilitySwingEngine";
import type { MatchState } from "../matchEngine";

const lastProbability: Record<string, number | null> = {};

export function computeMatchDrama(
  state: MatchState
) {
  const matchId = state.matchId;
  let drama = 0;

  const pressure = computeChasePressure(state);

  if (pressure) {
    drama += pressure.pressureIndex * 0.4;

    if (pressure.deathLevel === "FINAL_OVER") {
      drama += 30;
    }
  }

  const probability = computeWinProbability(state);

  if (probability) {
    const swing = computeProbabilitySwing(
      lastProbability[matchId] ?? null,
      state
    );

    lastProbability[matchId] = probability.battingWinProbability;

    if (swing) {
      if (swing.intensity === "MODERATE") drama += 10;
      if (swing.intensity === "MAJOR") drama += 20;
      if (swing.intensity === "SHOCK") drama += 35;
    }
  }

  return Math.min(100, Math.round(drama));
}