import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { eventStore } from "@/persistence/eventStore";
import { processAnalyticsEvent } from "./analytics/analyticsEngine";
import { processHighlightEvent } from "./highlights/highlightEngine";
import {
  processNarrativeEvent,
} from "./narrative/narrativeEngine";
import { processCommentaryEvent } from "./commentary/commentaryEngine";
import { getMatchConfig } from "./matchFormat";
export type ScoringEvent =
  | { type: "RUN"; runs?: number }
  | { type: "FOUR" }
  | { type: "SIX" }
  | { type: "WICKET" }
  | { type: "WD" }
  | { type: "NB" };

/* ========================================================
   TYPES
======================================================== */

export type InningsState = {
  runs: number;
  wickets: number;
  over: number;
  ball: number;
  overs: Record<number, BallEvent[]>;
  completed: boolean;
};

export type MatchState = {
  matchId: string;

  format: "T20" | "ODI" | "TEST";
  configOvers: number | null;

  innings: InningsState[];
  currentInningsIndex: number;

  activeBranchId: string;
  branches: string[];
};

/* ========================================================
   STORE
======================================================== */

const matches = new Map<string, MatchState>();
const eventStreams: Record<string, BallEvent[]> = {};
const matchListeners: Record<string, Set<() => void>> = {};
const snapshotMap: Record<string, Record<number, MatchState>> = {};
export const temporalIndex: Record<
  string,
  { index: number; innings: number; over: number }[]
> = {};

/* ========================================================
   UTILS
======================================================== */

function cloneState(state: MatchState): MatchState {
  return JSON.parse(JSON.stringify(state));
}

function saveSnapshot(
  matchId: string,
  inningsIndex: number,
  over: number,
  state: MatchState
) {
  if (!snapshotMap[matchId]) snapshotMap[matchId] = {};
  snapshotMap[matchId][over] = cloneState(state);

  eventStore.saveSnapshot(matchId, over, state).catch(console.error);

  if (!temporalIndex[matchId]) temporalIndex[matchId] = [];
  temporalIndex[matchId].push({
    index: eventStreams[matchId].length,
    innings: inningsIndex,
    over
  });
}

function emit(matchId: string) {
  matchListeners[matchId]?.forEach(l => l());
}

/* ========================================================
   INIT
======================================================== */

export function initMatch(
  matchId: string,
  format: "T20" | "ODI" | "TEST" = "T20"
) {
  if (matches.has(matchId)) return;

  const config = getMatchConfig(format);

  matches.set(matchId, {
    matchId,
    format,
    configOvers: config.oversPerInnings,
    innings: [
      {
        runs: 0,
        wickets: 0,
        over: 0,
        ball: 0,
        overs: {},
        completed: false
      }
    ],
    currentInningsIndex: 0,
    activeBranchId: "main",
    branches: ["main"]
  });

  eventStreams[matchId] = [];
}

/* ========================================================
   REDUCER
======================================================== */

function reduce(
  state: MatchState,
  event: ScoringEvent
): { next: MatchState; ballEvent: BallEvent } {
  const next = cloneState(state);

  const innings = next.innings[next.currentInningsIndex];

  const ballEvent: BallEvent = {
    id: crypto.randomUUID(),
    slug: state.matchId,
    over: innings.over + innings.ball / 10,
    runs:
      event.type === "FOUR"
        ? 4
        : event.type === "SIX"
        ? 6
        : event.type === "RUN"
        ? event.runs ?? 1
        : event.type === "WD" || event.type === "NB"
        ? 1
        : 0,
    wicket: event.type === "WICKET",
    extra: event.type === "WD" || event.type === "NB",
    type: event.type,
    timestamp: Date.now(),
    isLegalDelivery: event.type !== "WD" && event.type !== "NB",
    valid: true,
    branchId: state.activeBranchId
  };

  if (!innings.overs[innings.over])
    innings.overs[innings.over] = [];

  innings.overs[innings.over].push(ballEvent);

  if (event.type !== "WD" && event.type !== "NB") {
    innings.ball++;
  }

  if (event.type === "RUN") innings.runs += event.runs ?? 1;
  if (event.type === "FOUR") innings.runs += 4;
  if (event.type === "SIX") innings.runs += 6;
  if (event.type === "WICKET") innings.wickets++;
  if (event.type === "WD" || event.type === "NB") innings.runs++;

  if (innings.ball >= 6) {
    const completedOver = innings.over;
    innings.over++;
    innings.ball = 0;

    saveSnapshot(
      state.matchId,
      next.currentInningsIndex,
      completedOver,
      next
    );

    // Limited overs innings completion
    if (
      next.configOvers !== null &&
      innings.over >= next.configOvers
    ) {
      innings.completed = true;

      next.innings.push({
        runs: 0,
        wickets: 0,
        over: 0,
        ball: 0,
        overs: {},
        completed: false
      });

      next.currentInningsIndex++;
    }
  }

  // Test innings completion by wickets
  if (
    state.format === "TEST" &&
    innings.wickets >= 10
  ) {
    innings.completed = true;

    next.innings.push({
      runs: 0,
      wickets: 0,
      over: 0,
      ball: 0,
      overs: {},
      completed: false
    });

    next.currentInningsIndex++;
  }

  return { next, ballEvent };
}

/* ========================================================
   DISPATCH
======================================================== */

export function dispatchBallEvent(
  matchId: string,
  event: ScoringEvent
) {
  let current = matches.get(matchId);
  if (!current) {
    initMatch(matchId);
    current = matches.get(matchId)!;
  }

  const { next, ballEvent } = reduce(current, event);

  matches.set(matchId, next);

  eventStreams[matchId].push(ballEvent);

  processAnalyticsEvent(matchId, ballEvent);
  processHighlightEvent(matchId, ballEvent);
  processNarrativeEvent(matchId, ballEvent);
  processCommentaryEvent(
    matchId,
    next.activeBranchId,
    ballEvent
  );

  pushToTimeline(ballEvent);
  eventStore.appendEvent(matchId, ballEvent);

  emit(matchId);
}

/* ========================================================
   ACCESSORS
======================================================== */

export function getMatchState(matchId: string) {
  return matches.get(matchId);
}

export function getEventStream(matchId: string) {
  return eventStreams[matchId] ?? [];
}

export function subscribeMatch(
  matchId: string,
  cb: () => void
) {
  if (!matchListeners[matchId])
    matchListeners[matchId] = new Set();
  matchListeners[matchId].add(cb);
  return () =>
    matchListeners[matchId].delete(cb);
}

export function hydrateMatchState(
  matchId: string,
  state: MatchState
) {
  matches.set(matchId, state);
}

export function reduceStateOnly(
  state: MatchState,
  event: BallEvent
): MatchState {
  const engineEvent = {
    type: event.type,
    runs: event.runs
  } as ScoringEvent;

  const { next } = reduce(state, engineEvent);
  return next;
}

export function setEventStream(
  matchId: string,
  events: BallEvent[]
) {
  eventStreams[matchId] = [...events];
}
/* ========================================================
   SNAPSHOT ACCESS
======================================================== */

export function getSnapshot(
  matchId: string,
  over: number
): MatchState | undefined {
  return snapshotMap[matchId]?.[over];
}