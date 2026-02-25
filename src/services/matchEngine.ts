import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { rebuildStateFromIndex } from "./timelineScrubber";
import { eventStore } from "@/persistence/eventStore";
import { processAnalyticsEvent } from "./analytics/analyticsEngine";
import { processHighlightEvent } from "./highlights/highlightEngine";


const branchRegistry: Record<string, Record<string, Branch>> = {};
/*
-------------------------------------------------------
TYPES
-------------------------------------------------------
*/

type Branch = {
  id: string;
  parentId?: string;
  createdAt: number;
};

export type BranchRegistry = Record<string, Record<string, Branch>>;

export type ScoringEvent =
  | { type: "RUN"; runs?: number }
  | { type: "FOUR" }
  | { type: "SIX" }
  | { type: "WICKET" }
  | { type: "WD" }
  | { type: "NB" };

export type CorrectionEvent =
  | { type: "CORRECTION_UNDO_LAST" }
  | { type: "CORRECTION_DELETE"; targetEventId: string }
  | { type: "CORRECTION_REPLACE"; targetEventId: string; replacement: Partial<BallEvent> };

export type EngineBallEvent = ScoringEvent | CorrectionEvent;

export type MatchState = {
  matchId: string;
  runs: number;
  wickets: number;
  over: number;
  ball: number;
  overs: Record<number, BallEvent[]>;
  activeBranchId: string;
  branches: string[];
};

/*
-------------------------------------------------------
ENGINE STORE
-------------------------------------------------------
*/

const matches = new Map<string, MatchState>();
const eventStreams: Record<string, BallEvent[]> = {};
const matchListeners: Record<string, Set<() => void>> = {};
const snapshotMap: Record<string, Record<number, MatchState>> = {};
export const temporalIndex: Record<string, { index: number; over: number }[]> = {};

/*
-------------------------------------------------------
UTILS
-------------------------------------------------------
*/

function cloneState(state: MatchState): MatchState {
  return JSON.parse(JSON.stringify(state));
}

function saveSnapshot(matchId: string, over: number, state: MatchState) {
  if (!snapshotMap[matchId]) snapshotMap[matchId] = {};

  const cloned = cloneState(state);
  snapshotMap[matchId][over] = cloned;

  eventStore.saveSnapshot(matchId, over, cloned)
    .catch(err => console.error("Snapshot persistence failed:", err));
}

function emit(matchId: string) {

  const run = () => matchListeners[matchId]?.forEach(l => l());

  if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
    requestAnimationFrame(run);
  } else {
    setTimeout(run, 0);
  }
}

/*
-------------------------------------------------------
PUBLIC API
-------------------------------------------------------
*/

export function setEventStream(matchId: string, events: BallEvent[]) {
  eventStreams[matchId] = [...events];
}

export function getEventStream(matchId: string): BallEvent[] {
  return eventStreams[matchId] ?? [];
}

export function subscribeMatch(matchId: string, cb: () => void) {
  if (!matchListeners[matchId]) matchListeners[matchId] = new Set();
  matchListeners[matchId].add(cb);
  return () => matchListeners[matchId].delete(cb);
}

export function getMatchState(matchId: string) {
  return matches.get(matchId);
}

export function initMatch(matchId: string) {
  if (matches.has(matchId)) return;

  matches.set(matchId, {
    matchId,
    runs: 0,
    wickets: 0,
    over: 0,
    ball: 0,
    overs: {},
    activeBranchId: "main",
    branches: ["main"]
  });

  eventStreams[matchId] = [];

  branchRegistry[matchId] = {
    main: {
      id: "main",
      createdAt: Date.now()
    }
  };

  emit(matchId);
}

/*
-------------------------------------------------------
REDUCER
-------------------------------------------------------
*/

function reduce(
  state: MatchState,
  event: ScoringEvent
): { next: MatchState; ballEvent: BallEvent } {

  const next: MatchState = {
    ...state,
    overs: { ...state.overs }
  };

  const ballEvent: BallEvent = {
    id: crypto.randomUUID(),
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
    isLegalDelivery: event.type !== "WD" && event.type !== "NB",
    valid: true,
    branchId: state.activeBranchId
  };

  const overNumber = state.over;

  if (!next.overs[overNumber]) next.overs[overNumber] = [];
  next.overs[overNumber] = [...next.overs[overNumber], ballEvent];

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
    case "NB":
      next.runs += 1;
      return { next, ballEvent };
  }

  if (next.ball >= 6) {
    const completedOver = next.over;
    next.over += 1;
    next.ball = 0;

    saveSnapshot(state.matchId, completedOver, next);

    if (!temporalIndex[state.matchId]) temporalIndex[state.matchId] = [];
    temporalIndex[state.matchId].push({
      index: eventStreams[state.matchId].length,
      over: completedOver
    });
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

  const timeline = eventStreams[matchId];

  // --- Corrections ---
  if (event.type === "CORRECTION_UNDO_LAST") {
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (timeline[i]?.valid) {
        timeline[i].valid = false;
        break;
      }
    }

    const rebuilt = rebuildStateFromIndex(matchId, timeline.length - 1, current);
    if (rebuilt) matches.set(matchId, rebuilt);
    emit(matchId);
    return;
  }

  if (event.type === "CORRECTION_DELETE") {
    const target = timeline.find(e => e.id === event.targetEventId);
    if (target) target.valid = false;

    const rebuilt = rebuildStateFromIndex(matchId, timeline.length - 1, current);
    if (rebuilt) matches.set(matchId, rebuilt);
    emit(matchId);
    return;
  }

  // --- Normal scoring ---
  const scoringEvent = event as ScoringEvent;
  const { next, ballEvent } = reduce(current, scoringEvent);

  matches.set(matchId, next);

  eventStreams[matchId].push(ballEvent);
  processAnalyticsEvent(matchId, ballEvent);
  processHighlightEvent(matchId, ballEvent);
  

  pushToTimeline(ballEvent);
  eventStore.appendEvent(matchId, ballEvent);

  emit(matchId);
}

/*
-------------------------------------------------------
STATE ONLY REDUCER
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
HYDRATE
-------------------------------------------------------
*/

export function hydrateMatchState(matchId: string, state: MatchState) {
  matches.set(matchId, state);
  emit(matchId);
}
function mapBallEventToEngineEvent(event: BallEvent): ScoringEvent {

  switch (event.type) {

    case "RUN":
      return { type: "RUN", runs: event.runs };

    case "FOUR":
      return { type: "FOUR" };

    case "SIX":
      return { type: "SIX" };

    case "WICKET":
      return { type: "WICKET" };

    case "WD":
      return { type: "WD" };

    case "NB":
      return { type: "NB" };

    default:
      throw new Error(`Unsupported event type: ${event.type}`);
  }
}
/*
-------------------------------------------------------
SNAPSHOT ACCESS
-------------------------------------------------------
*/

export function getSnapshot(matchId: string, over: number) {
  return snapshotMap[matchId]?.[over];
}