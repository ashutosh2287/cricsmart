import { BallEvent } from "@/types/ballEvent";
import { getEventStream, getMatchState } from "../matchEngine";
import { calculateRunRate } from "./metrics/runRate";
import { calculateMomentum } from "./metrics/momentum";
import { emitDirectorSignal } from "../directorSignalBus";

/*
-------------------------------------------------------
TYPES
-------------------------------------------------------
*/

export type AnalyticsResult = {
  runRate: number[];
  momentum: number[];
};

type IncrementalAnalyticsState = {
  runs: number;
  balls: number;
  runRateHistory: number[];
  momentumHistory: number[];
};

/*
-------------------------------------------------------
INCREMENTAL CACHE (REAL-TIME MODE)
-------------------------------------------------------
*/

const analyticsCache: Record<string, IncrementalAnalyticsState> = {};

/*
-------------------------------------------------------
INIT / RESET
-------------------------------------------------------
*/

export function initAnalytics(matchId: string) {
  analyticsCache[matchId] = {
    runs: 0,
    balls: 0,
    runRateHistory: [],
    momentumHistory: []
  };
}

export function resetAnalytics(matchId: string) {
  delete analyticsCache[matchId];
}

/*
-------------------------------------------------------
INCREMENTAL PROCESSOR (O(1) PER EVENT)
-------------------------------------------------------
*/

export function processAnalyticsEvent(
  matchId: string,
  event: BallEvent
) {

  let state = analyticsCache[matchId];

  if (!state) {
    initAnalytics(matchId);
    state = analyticsCache[matchId];
  }

  // Skip invalid events
  if (!event.valid) return;

  // Update totals
  state.runs += event.runs ?? 0;

  if (event.isLegalDelivery) {
    state.balls++;
  }

  // Run Rate
  const overs = state.balls / 6;
  const runRate = overs > 0 ? state.runs / overs : 0;
  state.runRateHistory.push(runRate);

  // Momentum (simple version)
let momentum = event.runs ?? 0;
if (event.wicket) momentum -= 5;

state.momentumHistory.push(momentum);

/*
-------------------------------------------------------
DIRECTOR SIGNAL EMISSION
-------------------------------------------------------
*/

// Always emit momentum update signal
emitDirectorSignal({
  type: "MOMENTUM_UPDATE",
  value: momentum,
  eventId: event.id
});

// Detect pressure spike (example logic)
if (momentum >= 4 || event.wicket) {
  emitDirectorSignal({
    type: "PRESSURE_SPIKE",
    value: momentum,
    eventId: event.id
  });
}
}

/*
-------------------------------------------------------
GET INCREMENTAL RESULT
-------------------------------------------------------
*/

export function getIncrementalAnalytics(
  matchId: string
): AnalyticsResult {

  const state = analyticsCache[matchId];

  if (!state) {
    return { runRate: [], momentum: [] };
  }

  return {
    runRate: state.runRateHistory,
    momentum: state.momentumHistory
  };
}

/*
-------------------------------------------------------
FULL REBUILD MODE (REPLAY SAFE)
-------------------------------------------------------
*/

export function computeAnalytics(
  matchId: string
): AnalyticsResult {

  const events = getEventStream(matchId);
  const state = getMatchState(matchId);

  if (!state) {
    return { runRate: [], momentum: [] };
  }

  // Filter active branch
  const filtered = events.filter(e =>
    e.valid && (!e.branchId || e.branchId === state.activeBranchId)
  );

  return {
    runRate: calculateRunRate(filtered),
    momentum: calculateMomentum(filtered)
  };
}