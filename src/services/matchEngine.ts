import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { emitCommand } from "./commandBus";

/*
-------------------------------------------------------
ENGINE EVENT TYPES
-------------------------------------------------------
*/

export type EngineBallEvent =
  | { type: "RUN"; runs?: number }
  | { type: "FOUR" }
  | { type: "SIX" }
  | { type: "WICKET" }
  | { type: "WD" }
  | { type: "NB" };

/*
-------------------------------------------------------
MATCH STATE
-------------------------------------------------------
*/

export type MatchState = {
  matchId: string;
  runs: number;
  wickets: number;
  over: number;
  ball: number;

  // existing structured history
  overs: Record<number, BallEvent[]>;

  // ⭐ NEW TEMPORAL INDEX
  timelineIndex: BallEvent[];
};
/*
-------------------------------------------------------
ENGINE STORE
-------------------------------------------------------
*/

const matches = new Map<string, MatchState>();
const matchListeners: Record<string, Set<() => void>> = {};

/*
================================================
SNAPSHOT STORAGE
================================================
*/

const snapshotMap: Record<string, Record<number, MatchState>> = {};

function cloneState(state: MatchState): MatchState {
  return JSON.parse(JSON.stringify(state));
}

function saveSnapshot(matchId: string, over: number, state: MatchState) {

  if (!snapshotMap[matchId]) {
    snapshotMap[matchId] = {};
  }

  snapshotMap[matchId][over] = cloneState(state);
}

/*
-------------------------------------------------------
EMIT
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
    overs: {},
    timelineIndex: [] // ⭐ NEW
  });

  emit(matchId);
}

/*
-------------------------------------------------------
REDUCER
-------------------------------------------------------
*/

function reduce(
  state: MatchState,
  event: EngineBallEvent
): { next: MatchState; ballEvent: BallEvent } {

  const next: MatchState = {
    ...state,
    overs: { ...state.overs }
  };

  const ballEvent: BallEvent = {
    slug: state.matchId,
    over: state.over + state.ball / 10,
    runs:
      event.type === "FOUR" ? 4 :
      event.type === "SIX" ? 6 :
      event.type === "RUN" ? (event.runs ?? 1) :
      event.type === "WD" || event.type === "NB" ? 1 : 0,
    wicket: event.type === "WICKET",
    extra: event.type === "WD" || event.type === "NB",
    type: event.type,
    timestamp: Date.now(),
    isLegalDelivery: event.type !== "WD" && event.type !== "NB"
  };

  const overNumber = state.over;

  if (!next.overs[overNumber]) {
    next.overs[overNumber] = [];
  }

  next.overs[overNumber] = [
    ...next.overs[overNumber],
    ballEvent
  ];
  /*
-------------------------------------------------------
TEMPORAL INDEX RECORD
-------------------------------------------------------
*/

next.timelineIndex = [
  ...state.timelineIndex,
  ballEvent
];

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
      return { next, ballEvent };

    case "NB":
      next.runs += 1;
      return { next, ballEvent };
  }

  if (next.ball >= 6) {

    const completedOver = next.over;

    next.over += 1;
    next.ball = 0;

    saveSnapshot(state.matchId, completedOver, next);
  }

  return { next, ballEvent };
}

/*
-------------------------------------------------------
MAIN ENTRY
-------------------------------------------------------
*/

export function dispatchBallEvent(matchId: string, event: EngineBallEvent) {

  let current = matches.get(matchId);

  if (!current) {
    initMatch(matchId);
    current = matches.get(matchId)!;
  }

  const { next, ballEvent } = reduce(current, event);

  matches.set(matchId, next);

  switch (event.type) {

    case "RUN":
      emitCommand({ type: "RUN_SCORED", slug: matchId, runs: event.runs ?? 1 });
      break;

    case "FOUR":
      emitCommand({ type: "BOUNDARY_FOUR", slug: matchId });
      break;

    case "SIX":
      emitCommand({ type: "BOUNDARY_SIX", slug: matchId });
      break;

    case "WICKET":
      emitCommand({ type: "WICKET_FALL", slug: matchId });
      break;
  }

  pushToTimeline(ballEvent);

  emit(matchId);
}

/*
-------------------------------------------------------
MAP BALL EVENT → ENGINE EVENT
-------------------------------------------------------
*/

function mapBallEventToEngineEvent(event: BallEvent): EngineBallEvent {

  switch (event.type) {
    case "RUN": return { type: "RUN", runs: event.runs };
    case "FOUR": return { type: "FOUR" };
    case "SIX": return { type: "SIX" };
    case "WICKET": return { type: "WICKET" };
    case "WD": return { type: "WD" };
    case "NB": return { type: "NB" };
    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
}

/*
-------------------------------------------------------
STATE ONLY REDUCER (REPLAY SCRUB)
-------------------------------------------------------
*/

export function reduceStateOnly(
  state: MatchState,
  event: BallEvent
): MatchState {

  const engineEvent = mapBallEventToEngineEvent(event);

  const { next } = reduce(state, engineEvent);

  return next;
}

/*
-------------------------------------------------------
UTILS
-------------------------------------------------------
*/

export function resetMatch(matchId: string) {
  matches.delete(matchId);
}

export function hydrateMatchState(matchId: string, state: MatchState) {

  const existing = getMatchState(matchId);

  if (existing) {
    Object.assign(existing, state);
  } else {
    initMatch(matchId);
    Object.assign(getMatchState(matchId)!, state);
  }
}

export function getSnapshot(matchId: string, over: number) {
  return snapshotMap[matchId]?.[over];
}