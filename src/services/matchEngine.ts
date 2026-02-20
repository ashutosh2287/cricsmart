// services/matchEngine.ts

export type EngineBallEvent =
  | { type: "RUN"; runs?: number }
  | { type: "FOUR" }
  | { type: "SIX" }
  | { type: "WICKET" }
  | { type: "WD" }
  | { type: "NB" };

import { pushToTimeline } from "./broadcastTimeline";
import { emitCommand } from "./commandBus";

/*
-------------------------------------------------------
MATCH STATE TYPE
-------------------------------------------------------
*/

export type MatchState = {
  matchId: string;
  runs: number;
  wickets: number;
  over: number;
  ball: number;
};

/*
-------------------------------------------------------
ENGINE STORE
-------------------------------------------------------
*/

const matches = new Map<string, MatchState>();

const matchListeners: Record<string, Set<() => void>> = {};

/*
-------------------------------------------------------
EMIT (MATCH SCOPED)
-------------------------------------------------------
*/

function emit(matchId: string) {

  const run = () => {
    matchListeners[matchId]?.forEach((l) => l());
  };

  if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
    requestAnimationFrame(run);
  } else {
    setTimeout(run, 0);
  }

}

/*
-------------------------------------------------------
SUBSCRIPTIONS
-------------------------------------------------------
*/

export function subscribeMatch(matchId: string, cb: () => void) {

  if (!matchListeners[matchId]) {
    matchListeners[matchId] = new Set();
  }

  matchListeners[matchId].add(cb);

  return () => {
    matchListeners[matchId].delete(cb);
  };
}

export function getMatchState(matchId: string) {
  return matches.get(matchId);
}

/*
-------------------------------------------------------
INIT MATCH
-------------------------------------------------------
*/

export function initMatch(matchId: string) {

  if (matches.has(matchId)) return;

  matches.set(matchId, {
    matchId,
    runs: 0,
    wickets: 0,
    over: 0,
    ball: 0,
  });

  emit(matchId);
}

/*
-------------------------------------------------------
REDUCER (PURE)
-------------------------------------------------------
*/

function reduce(state: MatchState, event: EngineBallEvent): MatchState {

  const next: MatchState = { ...state };

  switch (event.type) {

    case "RUN":
      next.runs += event.runs ?? 1;
      next.ball += 1;
      break;

    case "FOUR":
      next.runs += 4;
      next.ball += 1;
      break;

    case "SIX":
      next.runs += 6;
      next.ball += 1;
      break;

    case "WICKET":
      next.wickets += 1;
      next.ball += 1;
      break;

    case "WD":
      next.runs += 1;
      return next;

    case "NB":
      next.runs += 1;
      return next;
  }

  if (next.ball >= 6) {
    next.over += 1;
    next.ball = 0;
  }

  return next;
}

/*
-------------------------------------------------------
MAIN ENTRY (SIDE EFFECTS LIVE HERE)
-------------------------------------------------------
*/

export function dispatchBallEvent(matchId: string, event: EngineBallEvent) {

  let current = matches.get(matchId);

  if (!current) {
    initMatch(matchId);
    current = matches.get(matchId)!;
  }

  const updated = reduce(current, event);

  matches.set(matchId, updated);

  /*
  -------------------------------------------------------
  EMIT DOMAIN COMMAND
  -------------------------------------------------------
  */

  switch (event.type) {

    case "RUN":
      emitCommand({
        type: "RUN_SCORED",
        slug: matchId,
        runs: event.runs ?? 1
      });
      break;

    case "FOUR":
      emitCommand({
        type: "BOUNDARY_FOUR",
        slug: matchId
      });
      break;

    case "SIX":
      emitCommand({
        type: "BOUNDARY_SIX",
        slug: matchId
      });
      break;

    case "WICKET":
      emitCommand({
        type: "WICKET_FALL",
        slug: matchId
      });
      break;
  }

  /*
  -------------------------------------------------------
  PUSH TO TIMELINE
  -------------------------------------------------------
  */

  pushToTimeline({
    slug: matchId,
    over: updated.over + updated.ball / 10,
    runs:
      event.type === "FOUR" ? 4 :
      event.type === "SIX" ? 6 :
      event.type === "RUN" ? (event.runs ?? 1) :
      event.type === "WD" || event.type === "NB" ? 1 : 0,
    wicket: event.type === "WICKET",
    extra: event.type === "WD" || event.type === "NB",
    type: event.type,
    timestamp: Date.now(),
  });

  emit(matchId);
}

/*
-------------------------------------------------------
RESET
-------------------------------------------------------
*/

export function resetMatch(matchId: string) {
  matches.delete(matchId);
}