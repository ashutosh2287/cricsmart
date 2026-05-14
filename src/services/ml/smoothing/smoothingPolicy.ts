import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";

export type SmoothingContext = {
  state: MatchState;
  ballEvent?: BallEvent;
  previousProbability?: number;
  currentProbability: number;
};

export type SmoothingResult = {
  smoothedProbability: number;
  applied: boolean;
  previousWeight: number;
  currentWeight: number;
  criticalMoment: boolean;
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function isCriticalMoment(context: SmoothingContext): boolean {
  const innings = context.state.innings[context.state.currentInningsIndex];
  const over = innings?.over ?? 0;

  const wicket = Boolean(context.ballEvent?.wicket);
  const deathOver = over >= 16;
  const superOver = context.state.configOvers === 1;
  const previous = context.previousProbability ?? context.currentProbability;
  const spike = Math.abs(context.currentProbability - previous) >= 12;

  return wicket || deathOver || superOver || spike;
}

export function smoothProbability(context: SmoothingContext): SmoothingResult {
  const previous = context.previousProbability;
  if (previous === undefined || Number.isFinite(previous) === false) {
    return {
      smoothedProbability: clamp(context.currentProbability),
      applied: false,
      previousWeight: 0,
      currentWeight: 1,
      criticalMoment: false,
    };
  }

  const criticalMoment = isCriticalMoment(context);

  const previousWeight = criticalMoment ? 0.35 : 0.75;
  const currentWeight = criticalMoment ? 0.65 : 0.25;

  const smoothedProbability =
    previous * previousWeight + context.currentProbability * currentWeight;

  return {
    smoothedProbability: clamp(smoothedProbability),
    applied: true,
    previousWeight,
    currentWeight,
    criticalMoment,
  };
}
