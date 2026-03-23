import { BallEvent } from "@/types/ballEvent";
import { pushToTimeline } from "./broadcastTimeline";
import { eventStore } from "@/persistence/eventStore";
import { getMatchConfig } from "./matchFormat";
import { advanceClock } from "./timeEngine";
import { processMatchIntelligence } from "./matchIntelligenceEngine";
import { v4 as uuidv4 } from "uuid";
import { generateAdvancedCommentary } from "./commentary/advancedCommentaryEngine";
import { emitCommentary } from "@/services/commentary/commentaryBus";
export type CorrectionEvent =
  | { type: "CORRECTION_UNDO_LAST" }
  | { type: "CORRECTION_DELETE"; targetEventId: string }
  | {
      type: "CORRECTION_REPLACE";
      targetEventId: string;
      replacement: Partial<BallEvent>;
    };
    type PlayerFields = {
  batsman: string
  nonStriker: string
  bowler: string
}
export type ScoringEvent =
  | ({ type: "RUN"; runs?: number } & PlayerFields)
  | ({ type: "FOUR" } & PlayerFields)
  | ({ type: "SIX" } & PlayerFields)
  | ({ type: "WICKET" } & PlayerFields)
  | ({ type: "WD" } & PlayerFields)
  | ({ type: "NB" } & PlayerFields)
  | ({ type: "BYE"; runs: number } & PlayerFields)
  | ({ type: "LB"; runs: number } & PlayerFields);

  type BaseEvent = {
  id?: string; // 🔥 optional for simulation, required for replay
};

  export type EngineBallEvent =
  | (BaseEvent & {
      type: "RUN";
      runs: number;
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "FOUR";
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "SIX";
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "WICKET";
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "WD";
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "NB";
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "BYE";
      runs: number;
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "LB";
      runs: number;
      batsman: string;
      nonStriker: string;
      bowler: string;
    })
  | (BaseEvent & {
      type: "CORRECTION_UNDO_LAST";
    })
  | (BaseEvent & {
      type: "CORRECTION_DELETE";
      targetEventId: string;
    })
  | (BaseEvent & {
      type: "CORRECTION_REPLACE";
      targetEventId: string;
      replacement: EngineBallEvent;
    });

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
  striker?: string;
  nonStriker?: string;
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
const matchListeners: Record<string, Set<(state: MatchState) => void>> = {};
const snapshotMap: Record<
  string,
  Record<string, MatchState>
> = {};
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
  const key = `${inningsIndex}-${over}`;
snapshotMap[matchId][key] = cloneState(state);

  eventStore.saveSnapshot(matchId, over, state).catch(console.error);

  if (!temporalIndex[matchId]) temporalIndex[matchId] = [];
  temporalIndex[matchId].push({
    index: eventStreams[matchId].length,
    innings: inningsIndex,
    over
  });
}

function emit(matchId: string) {
  const state = matches.get(matchId);
  matchListeners[matchId]?.forEach(l => l(state!));
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
        completed: false,
        striker: "",
        nonStriker: ""
      }
    ],
    currentInningsIndex: 0,
    activeBranchId: "main",
    branches: ["main"]
  });

  eventStreams[matchId] = [];
}
type ScoringEventWithId = ScoringEvent & {
  id?: string;
};
/* ========================================================
   REDUCER
======================================================== */

function reduce(state: MatchState, event: ScoringEventWithId)
: { next: MatchState; ballEvent: BallEvent } {
  const next = cloneState(state);

  // 🔒 HARD SAFETY (VALID PLACE)
  if (next.innings.length > 2) {
    console.log("🛑 Fixing innings overflow");
    next.innings = next.innings.slice(0, 2);
  }

  

  const innings = next.innings[next.currentInningsIndex];

  // 🧠 SET STRIKER / NON-STRIKER (FIRST TIME ONLY)

if (!innings.striker) {
  innings.striker = event.batsman;
}

if (!innings.nonStriker) {
  innings.nonStriker = event.nonStriker;
}

const incomingId = event.id;
  const ballEvent: BallEvent = {
    id: incomingId ?? uuidv4(),
    slug: state.matchId,
    over: innings.over + innings.ball / 10,

    runs:
      event.type === "FOUR"
        ? 4
        : event.type === "SIX"
        ? 6
        : event.type === "RUN"
        ? event.runs ?? 1
        : event.type === "BYE" || event.type === "LB"
        ? event.runs ?? 0
        : event.type === "WD" || event.type === "NB"
        ? 1
        : 0,

    wicket: event.type === "WICKET",
    extra: event.type === "WD" || event.type === "NB",
    type: event.type,

    timestamp: Date.now(),
    isLegalDelivery: event.type !== "WD" && event.type !== "NB",

    valid: true,
    branchId: state.activeBranchId,

    batsman: event.batsman,
    nonStriker: innings.nonStriker ?? "",
    bowler: event.bowler ?? ""
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
  if (event.type === "BYE" || event.type === "LB") {
  innings.runs += event.runs ?? 0;
}

  // =============================
  // STRIKE ROTATION
  // =============================

 const runsScored =
  event.type === "FOUR"
    ? 4
    : event.type === "SIX"
    ? 6
    : event.type === "RUN"
    ? event.runs ?? 1
    : event.type === "BYE" || event.type === "LB"
    ? event.runs ?? 0
    : event.type === "WD" || event.type === "NB"
    ? 1
    : 0;
    // 🔁 Rotate on odd runs
if (runsScored % 2 === 1) {
  const temp = innings.striker;
  innings.striker = innings.nonStriker;
  innings.nonStriker = temp;
}


  // =============================
  // OVER COMPLETE
  // =============================

  if (innings.ball >= 6) {
  // 🔁 Rotate strike
  const temp = innings.striker;
  innings.striker = innings.nonStriker;
  innings.nonStriker = temp;

  const completedOver = innings.over;
  innings.over++;
  innings.ball = 0;

  saveSnapshot(
    state.matchId,
    next.currentInningsIndex,
    completedOver,
    next
  );

  // 🏁 T20 INNINGS COMPLETION FIX
  if (
    next.configOvers !== null &&
    innings.over >= next.configOvers
  ) {
    innings.completed = true;

    if (next.currentInningsIndex === 0) {
      if (next.innings.length < 2) {
        next.innings.push({
          runs: 0,
          wickets: 0,
          over: 0,
          ball: 0,
          overs: {},
          completed: false
        });
      }

      next.currentInningsIndex = 1;

    } else {
      console.log("🏆 Match finished (T20)");
    }
  }
}
  // =============================
  // WICKET ALL OUT FIX
  // =============================

  if (innings.wickets >= 10) {
    innings.completed = true;

    if (next.currentInningsIndex === 0) {
      if (next.innings.length < 2) {
        next.innings.push({
          runs: 0,
          wickets: 0,
          over: 0,
          ball: 0,
          overs: {},
          completed: false
        });
      }

      next.currentInningsIndex = 1;

    } else {
      console.log("🏆 Match finished (all out)");
    }
  }

  return { next, ballEvent };
}
/* ========================================================
   DISPATCH
======================================================== */

export function dispatchBallEvent(
  matchId: string,
  event: EngineBallEvent
) {
  let current = matches.get(matchId);
  if (!current) {
    initMatch(matchId);
    current = matches.get(matchId)!;
  }

  // ----------------------------------------
  // HANDLE CORRECTION EVENTS (stub for now)
  // ----------------------------------------

  if (
    event.type === "CORRECTION_UNDO_LAST" ||
    event.type === "CORRECTION_DELETE" ||
    event.type === "CORRECTION_REPLACE"
  ) {
    // TODO: implement correction logic later
    return;
  }

  // From here, TypeScript knows event is ScoringEvent

  const { next, ballEvent } = reduce(current, event);
// ✅ Generate commentary using CORRECT objects
const commentaryText = generateAdvancedCommentary(ballEvent, next);
console.log("BallEvent:", ballEvent);
console.log("🔥 COMMENTARY:", commentaryText);
emitCommentary({
  matchId,
  text: commentaryText,
  eventId: ballEvent.id,
  category: "BALL"
});

// ✅ Attach commentary to event itself
ballEvent.commentary = commentaryText;
  matches.set(matchId, next);

  eventStreams[matchId].push(ballEvent);
  advanceClock(matchId);

  processMatchIntelligence({
  matchId,
  branchId: next.activeBranchId,
  state: next,
  ballEvent
});
  pushToTimeline({
  ...ballEvent,
  commentary: commentaryText
});
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
  cb: (state: MatchState) => void
) {
  if (!matchListeners[matchId])
    matchListeners[matchId] = new Set();

  matchListeners[matchId].add(cb);

  return () => {
    matchListeners[matchId].delete(cb);
  };
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
  id: event.id, // 🔥 preserve
  type: event.type,
  runs: event.runs,
  batsman: event.batsman,
  nonStriker: event.nonStriker,
  bowler: event.bowler
} as unknown as ScoringEvent;

  const { next } = reduce(state, engineEvent);
  return next;
}

export function setEventStream(
  matchId: string,
  events: BallEvent[]
) {
  eventStreams[matchId] = [...events];
}


export function resetMatchState(matchId: string) {
  // 🔥 Remove old state
  matches.delete(matchId);

  // 🔥 Reinitialize fresh match
  initMatch(matchId);
}

/* ========================================================
   DERIVED INTELLIGENCE LAYER
======================================================== */


/* ========================================================
   SNAPSHOT ACCESS
======================================================== */

export function getSnapshot(
  matchId: string,
  inningsIndex: number,
  over: number
): MatchState | undefined {
  const key = `${inningsIndex}-${over}`;
  return snapshotMap[matchId]?.[key];
}