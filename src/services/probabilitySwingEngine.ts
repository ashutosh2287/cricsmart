import { computeWinProbability } from "./winProbabilityEngine";
import { MatchState } from "./matchEngine";

export type SwingIntensity =
  | "MINOR"
  | "MODERATE"
  | "MAJOR"
  | "SHOCK";

export type ProbabilitySwing = {
  delta: number;
  direction: "UP" | "DOWN";
  intensity: SwingIntensity;
  volatilityScore: number; // 0–100
};

/**
 * Deterministic swing detection.
 * Pure function.
 * Replay-safe.
 */
export function computeProbabilitySwing(
  previousProbability: number | null,
  state: MatchState
): ProbabilitySwing | null {

  const result = computeWinProbability(state);
  if (!result) return null;

  const current = result.battingWinProbability;

  if (previousProbability === null) return null;

  const delta = current - previousProbability;
  const absDelta = Math.abs(delta);

  // Ignore tiny noise
  if (absDelta < 4) return null;

  let intensity: SwingIntensity = "MINOR";

  if (absDelta >= 20) {
    intensity = "SHOCK";
  } else if (absDelta >= 14) {
    intensity = "MAJOR";
  } else if (absDelta >= 8) {
    intensity = "MODERATE";
  }

  // Volatility scoring (scaled 0–100)
  const volatilityScore =
    Math.min(100, absDelta * 5);

  return {
    delta,
    direction: delta > 0 ? "UP" : "DOWN",
    intensity,
    volatilityScore
  };
}