import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { emitCommand } from "./commandBus";
import { rebuildStateFromIndex } from "./timelineScrubber";

/*
-------------------------------------------------------
SCORING EVENT TYPES
-------------------------------------------------------
*/

export type ScoringEvent =
  | { type: "RUN"; runs?: number }
  | { type: "FOUR" }
  | { type: "SIX" }
  | { type: "WICKET" }
  | { type: "WD" }
  | { type: "NB" };

/*
-------------------------------------------------------
CORRECTION EVENT TYPES
-------------------------------------------------------
*/

export type CorrectionEvent =
  | { type: "CORRECTION_UNDO_LAST" }
  | { type: "CORRECTION_DELETE"; targetEventId: string }
  | { type: "CORRECTION_REPLACE"; targetEventId: string; replacement: Partial<BallEvent> };

export type EngineBallEvent = ScoringEvent | CorrectionEvent;

type Branch = {
  id: string;
  parentId?: string;
  createdAt: number;
};
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
  overs: Record<number, BallEvent[]>;
  timelineIndex: BallEvent[];
  activeBranchId: string;
  branches: string[]; // ⭐ NEW
};

/*
-------------------------------------------------------
ENGINE STORE
-------------------------------------------------------
*/

const matches = new Map<string, MatchState>();
const matchListeners: Record<string, Set<() => void>> = {};
const snapshotMap: Record<string, Record<number, MatchState>> = {};
const branchRegistry: Record<string, Record<string, Branch>> = {};

function cloneState(state: MatchState): MatchState {
  return JSON.parse(JSON.stringify(state));
}

function saveSnapshot(matchId: string, over: number, state: MatchState) {
  if (!snapshotMap[matchId]) snapshotMap[matchId] = {};
  snapshotMap[matchId][over] = cloneState(state);
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
    timelineIndex: [],
    activeBranchId: "main",
    branches: ["main"]
  });
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
REDUCER (SCORING ONLY)
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
    branchId: state.activeBranchId ?? "main"
  };

  const overNumber = state.over;

  if (!next.overs[overNumber]) next.overs[overNumber] = [];

  next.overs[overNumber] = [
    ...next.overs[overNumber],
    ballEvent
  ];

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

  const timeline = current.timelineIndex;

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

  if (event.type === "CORRECTION_REPLACE") {

    const targetIndex = timeline.findIndex(e => e.id === event.targetEventId);
    if (targetIndex === -1) return;

    const target = timeline[targetIndex];

    if (!target.branchId) {
      target.branchId = current.activeBranchId;
    }

    target.valid = false;

    const newBranchId = crypto.randomUUID();
    branchRegistry[matchId][newBranchId] = {
  id: newBranchId,
  parentId: current.activeBranchId,
  createdAt: Date.now()
};

current.branches.push(newBranchId);

    const replacement: BallEvent = {
      ...target,
      ...event.replacement,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      valid: true,
      replacedBy: undefined,
      branchId: newBranchId
    };

    target.replacedBy = replacement.id;

    current.activeBranchId = newBranchId;

    current.timelineIndex = [
      ...current.timelineIndex,
      replacement
    ];

    const rebuilt = rebuildStateFromIndex(matchId, current.timelineIndex.length - 1, current);
    if (rebuilt) matches.set(matchId, rebuilt);

    emit(matchId);
    return;
  }

  const scoringEvent = event as ScoringEvent;

  const { next, ballEvent } = reduce(current, scoringEvent);

  matches.set(matchId, next);

  switch (scoringEvent.type) {
    case "RUN":
      emitCommand({ type: "RUN_SCORED", slug: matchId, runs: scoringEvent.runs ?? 1 });
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

function mapBallEventToEngineEvent(event: BallEvent): ScoringEvent {

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
SNAPSHOT ACCESS
-------------------------------------------------------
*/

export function getSnapshot(matchId: string, over: number) {
  return snapshotMap[matchId]?.[over];
}
/*
-------------------------------------------------------
HYDRATE MATCH STATE
-------------------------------------------------------
*/

export function hydrateMatchState(matchId: string, state: MatchState) {

  const existing = matches.get(matchId);

  if (existing) {
    Object.assign(existing, state);
  } else {
    matches.set(matchId, state);
  }

  emit(matchId);
}