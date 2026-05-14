import { MatchState } from "../matchEngine";
import { BallEvent } from "@/types/ballEvent";
import { getEventStream } from "../matchEngine";
import { predictWinProbabilityFromState } from "../ml/prediction/winProbabilityPredictor";

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

  const result = predictWinProbabilityFromState(
    matchId,
    state,
    getEventStream(matchId)
  );

  if (!winProbStore[matchId]) {
    initWinProbability(matchId);
  }

  const innings =
    state.innings[state.currentInningsIndex];

  const over =
    innings.over + innings.ball / 10;

 const timeline = winProbStore[matchId].timeline;

// 🛑 prevent duplicate entries (same ball)
const last = timeline[timeline.length - 1];

if (last && Math.abs(last.over - over) < 0.001) {
  return;
}
const batting = Math.max(5, Math.min(95, result.battingWinProbability));
const bowling = 100 - batting;
timeline.push({
  over,
  batting,
  bowling,
  timestamp: ballEvent?.timestamp ?? Date.now(),
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
