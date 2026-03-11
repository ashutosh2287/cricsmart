import { BallEvent } from "@/types/ballEvent";
import { getEventStream, getMatchState } from "../matchEngine";
import { calculateRunRate } from "./metrics/runRate";
import { calculateMomentum } from "./metrics/momentum";
import { emitDirectorSignal } from "../directorSignalBus";

import {
  buildNarrativeTimeline,
  NarrativeTimeline
} from "../narrative/narrativeTimelineEngine";

/*
-------------------------------------------------------
TYPES
-------------------------------------------------------
*/

export type AnalyticsResult = {
  runRate: number[];
  momentum: number[];
  narrative?: NarrativeTimeline;
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

  emitDirectorSignal({
    type: "MOMENTUM_UPDATE",
    matchId,
    branchId: "main",
    eventId: event.id,
    value: momentum
  });

  if (momentum >= 4 || event.wicket) {

    emitDirectorSignal({
      type: "PRESSURE_SPIKE",
      matchId,
      branchId: "main",
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

  const filtered = events.filter(e =>
    e.valid && (!e.branchId || e.branchId === state.activeBranchId)
  );

  const runRate = calculateRunRate(filtered);
  const momentum = calculateMomentum(filtered);

  /*
  -------------------------------------------------------
  BUILD NARRATIVE INPUT STREAM
  -------------------------------------------------------
  */

  const narrativeInputs = filtered.map((e, i) => {

    const over = Math.floor(i / 6) + 1;

    return {
      momentum: momentum[i] ?? 0,
      pressure: Math.abs(momentum[i] ?? 0) / 6,
      winProbability: 0.5, // placeholder until winProbabilityEngine integrated
      wickets: e.wicket ? 1 : 0,
      over,
      ballNumber: i
    };

  });

  const narrative = buildNarrativeTimeline(narrativeInputs);

  return {
    runRate,
    momentum,
    narrative
  };
}