import type { OverPhase, PressureLevel } from "../types/commentary.types";

type PressureInput = {
  requiredRunRate: number;
  currentRunRate: number;
  wicketsRemaining: number;
  ballsRemaining: number;
  dotBallStreak: number;
  overPhase: OverPhase;
};

const PHASE_WEIGHTS: Record<OverPhase, number> = {
  POWERPLAY: 4,
  MIDDLE_OVERS: 8,
  DEATH_OVERS: 16,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculatePressureScore(input: PressureInput): number {
  const runRateGap = Math.max(0, input.requiredRunRate - input.currentRunRate);
  const wicketsLost = 10 - input.wicketsRemaining;
  const lateOversLoad = input.ballsRemaining <= 12 ? 14 : input.ballsRemaining <= 36 ? 8 : 0;

  return clamp(
    runRateGap * 8 +
      wicketsLost * 4 +
      input.dotBallStreak * 5 +
      PHASE_WEIGHTS[input.overPhase] +
      lateOversLoad,
    0,
    100,
  );
}

export function calculatePressureLevel(input: PressureInput): PressureLevel {
  const score = calculatePressureScore(input);

  if (score >= 75) return "EXTREME";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MEDIUM";
  return "LOW";
}
