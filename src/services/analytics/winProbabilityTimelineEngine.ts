import { MatchState } from "../matchEngine";
import { computeWinProbability } from "../winProbabilityEngine";
import { BallEvent } from "@/types/ballEvent";

export type WinProbabilityPoint = {
  over: number;
  batting: number;
  bowling: number;
  timestamp: number;
};

type WinProbState = {
  timeline: WinProbabilityPoint[];
};

const winProbStore: Record<string, WinProbState> = {};

export function initWinProbability(matchId: string) {
  winProbStore[matchId] = {
    timeline: []
  };
}

export function updateWinProbability(
  matchId: string,
  state: MatchState,
  ballEvent?: BallEvent
) {

  const result = computeWinProbability(state);
  if (!result) return;

  if (!winProbStore[matchId]) {
    initWinProbability(matchId);
  }

  const innings =
    state.innings[state.currentInningsIndex];

  const over =
    innings.over + innings.ball / 10;

  winProbStore[matchId].timeline.push({
    over,
    batting: result.battingWinProbability,
    bowling: result.bowlingWinProbability,
    timestamp: ballEvent?.timestamp ?? Date.now()
  });
}

export function getWinProbabilityTimeline(
  matchId: string
) {
  return (
    winProbStore[matchId] || {
      timeline: []
    }
  );
}

export function resetWinProbability(matchId: string) {
  delete winProbStore[matchId];
}