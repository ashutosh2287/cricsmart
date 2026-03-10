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

  const point: ProbabilityPoint = {
    over: innings.over + innings.ball / 10,
    battingProbability: probability.battingWinProbability,
    bowlingProbability: probability.bowlingWinProbability,
  };

  if (!probabilityTimeline[matchId]) {
    probabilityTimeline[matchId] = [];
  }

  probabilityTimeline[matchId].push(point);

}

export function getProbabilityTimeline(matchId: string) {
  return probabilityTimeline[matchId] ?? [];
}