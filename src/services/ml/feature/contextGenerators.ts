import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";

export type SharedFeatureContext = {
  pressureMetric: number;
  momentumMetric: number;
  partnershipRuns: number;
  battingStabilityMetric: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function generatePressureMetric(state: MatchState): number {
  const innings = state.innings[state.currentInningsIndex];
  const wickets = innings?.wickets ?? 0;
  const over = innings?.over ?? 0;
  const pressure = wickets * 8 + Math.max(0, over - 14) * 4;
  return clamp(pressure, 0, 100);
}

export function generateMomentumMetric(ballEvent?: BallEvent): number {
  if (!ballEvent) return 0;
  if (ballEvent.wicket) return -8;
  return clamp(ballEvent.runs ?? 0, -12, 12);
}

export function generatePartnershipMetric(state: MatchState): number {
  const innings = state.innings[state.currentInningsIndex];
  const records = innings?.battingRecords ?? [];
  const strikerRuns = records.find((record) => record.name === innings.striker)?.runs ?? 0;
  const nonStrikerRuns = records.find((record) => record.name === innings.nonStriker)?.runs ?? 0;
  return strikerRuns + nonStrikerRuns;
}

export function generateBattingStabilityMetric(state: MatchState): number {
  const innings = state.innings[state.currentInningsIndex];
  const wickets = innings?.wickets ?? 0;
  return clamp(1 - wickets / 10, 0, 1);
}

export function generateSharedFeatureContext(
  state: MatchState,
  ballEvent?: BallEvent
): SharedFeatureContext {
  return {
    pressureMetric: generatePressureMetric(state),
    momentumMetric: generateMomentumMetric(ballEvent),
    partnershipRuns: generatePartnershipMetric(state),
    battingStabilityMetric: generateBattingStabilityMetric(state),
  };
}
