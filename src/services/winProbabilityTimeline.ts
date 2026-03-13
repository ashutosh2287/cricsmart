// src/services/winProbabilityTimeline.ts

import { computeWinProbability } from "./winProbabilityEngine";
import { getMatchState } from "./matchEngine";

export type ProbabilityPoint = {
  over: number;
  battingProbability: number;
  bowlingProbability: number;
};

const probabilityTimeline: Record<string, ProbabilityPoint[]> = {};

export function updateWinProbabilityTimeline(matchId: string) {

  const state = getMatchState(matchId);
  if (!state) return;

  const probability = computeWinProbability(state);
  if (!probability) return;

  const innings = state.innings[state.currentInningsIndex];

  const overValue = innings.over + innings.ball / 10;

  const point: ProbabilityPoint = {
    over: overValue,
    battingProbability: probability.battingWinProbability,
    bowlingProbability: probability.bowlingWinProbability
  };

  if (!probabilityTimeline[matchId]) {
    probabilityTimeline[matchId] = [];
  }

  const timeline = probabilityTimeline[matchId];

  // Prevent duplicate entries for same ball
  const last = timeline[timeline.length - 1];

  if (last && last.over === point.over) {
    timeline[timeline.length - 1] = point;
  } else {
    timeline.push(point);
  }

}

export function getProbabilityTimeline(matchId: string) {
  return probabilityTimeline[matchId] ?? [];
}

export function resetWinProbabilityTimeline(matchId: string) {
  delete probabilityTimeline[matchId];
}