import { MatchState, getEventStream } from "../matchEngine";
import type { BallEvent } from "@/types/ballEvent";
import type { BallDomainEvent } from "@/domain/events";
import { predictRuntimeWinProbability } from "@/services/ml/prediction/winProbabilityRuntime";
import type { PredictionSource } from "@/services/ml/contracts/winProbability";

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
const domainBallStreamStore: Record<string, BallEvent[]> = {};

function getSource(ballEvent?: BallEvent): PredictionSource {
  return ballEvent?.eventSource === "LIVE_INGESTION"
    ? "LIVE"
    : ballEvent?.eventSource === "MOCK_INGESTION"
      ? "MOCK"
      : ballEvent?.eventSource === "REPLAY"
        ? "REPLAY"
        : "SIMULATION";
}

function appendPoint(input: {
  matchId: string;
  state: MatchState;
  ballEvent?: BallEvent;
  eventStream: BallEvent[];
}): WinProbabilityPoint | null {
  const { matchId, state, ballEvent, eventStream } = input;

  if (!winProbStore[matchId]) {
    initWinProbability(matchId);
  }

  const innings = state.innings[state.currentInningsIndex];
  const over = innings.over + innings.ball / 10;
  const timeline = winProbStore[matchId].timeline;
  const last = timeline[timeline.length - 1];

  if (last && Math.abs(last.over - over) < 0.001) {
    return null;
  }

  const runtimePrediction = predictRuntimeWinProbability({
    matchId,
    state,
    eventStream,
    source: getSource(ballEvent),
    previousProbability: last?.batting ?? null,
    timestamp: ballEvent?.timestamp ?? Date.now(),
  });
  if (!runtimePrediction) return null;

  const batting = Math.max(5, Math.min(95, runtimePrediction.probability));
  const point: WinProbabilityPoint = {
    over,
    batting,
    bowling: 100 - batting,
    timestamp: ballEvent?.timestamp ?? Date.now(),
  };
  timeline.push(point);
  return point;
}

export function initWinProbability(matchId: string) {
  winProbStore[matchId] = { timeline: [] };
  domainBallStreamStore[matchId] = [];
}

export function updateWinProbability(
  matchId: string,
  state: MatchState,
  ballEvent?: BallEvent
) {
  return appendPoint({
    matchId,
    state,
    ballEvent,
    eventStream: getEventStream(matchId),
  });
}

export function updateWinProbabilityFromDomainBall(event: BallDomainEvent) {
  if (!domainBallStreamStore[event.runtimeMatchId]) {
    domainBallStreamStore[event.runtimeMatchId] = [];
  }
  domainBallStreamStore[event.runtimeMatchId].push(event.ballEvent);

  return appendPoint({
    matchId: event.runtimeMatchId,
    state: event.state,
    ballEvent: event.ballEvent,
    eventStream: domainBallStreamStore[event.runtimeMatchId],
  });
}

export function getWinProbabilityTimeline(matchId: string) {
  return winProbStore[matchId] || { timeline: [] };
}

export function resetWinProbability(matchId: string) {
  delete winProbStore[matchId];
  delete domainBallStreamStore[matchId];
}
