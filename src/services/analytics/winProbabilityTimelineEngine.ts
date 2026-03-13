import { MatchState } from "../matchEngine";
import { computeWinProbability } from "../winProbabilityEngine";

type WinProbState = {
  batting: number[];
  bowling: number[];
};

const winProbStore: Record<string, WinProbState> = {};

export function initWinProbability(matchId: string) {
  winProbStore[matchId] = {
    batting: [],
    bowling: []
  };
}

export function updateWinProbability(
  matchId: string,
  state: MatchState
) {

  const result = computeWinProbability(state);
  if (!result) return;

  if (!winProbStore[matchId]) {
    initWinProbability(matchId);
  }

  winProbStore[matchId].batting.push(
    result.battingWinProbability
  );

  winProbStore[matchId].bowling.push(
    result.bowlingWinProbability
  );
}

export function getWinProbabilityTimeline(
  matchId: string
) {

  return (
    winProbStore[matchId] || {
      batting: [],
      bowling: []
    }
  );

}

export function resetWinProbability(matchId: string) {
  delete winProbStore[matchId];
}