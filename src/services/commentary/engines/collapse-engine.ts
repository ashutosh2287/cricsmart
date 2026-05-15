import type { CollapseRisk, PressureLevel } from "../types/commentary.types";

type CollapseInput = {
  wicketsInCluster: number;
  recentRuns: number;
  pressureLevel: PressureLevel;
  battingControl: number;
  recentWickets: number;
};

const PRESSURE_WEIGHT: Record<PressureLevel, number> = {
  LOW: 0,
  MEDIUM: 10,
  HIGH: 20,
  EXTREME: 30,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function detectCollapseRisk(input: CollapseInput): CollapseRisk {
  const scoringSlowdown = Math.max(0, 10 - input.recentRuns);
  const controlPenalty = Math.max(0, 55 - input.battingControl);
  const score = clamp(
    input.wicketsInCluster * 18 +
      input.recentWickets * 14 +
      scoringSlowdown * 2 +
      controlPenalty * 0.75 +
      PRESSURE_WEIGHT[input.pressureLevel],
    0,
    100,
  );

  if (score >= 65) return "HIGH";
  if (score >= 35) return "MEDIUM";
  return "LOW";
}
