import { BallEvent } from "@/types/ballEvent";
import { NarrativeState, NarrativeArc } from "./narrativeTypes";
import { emitNarrativeSignal } from "./narrativeSignalBus";
import {
  getNarrativeState,
  setNarrativeState,
} from "./narrativeStore";
export { getNarrativeState } from "./narrativeStore";
import {
  resetNarrative as resetNarrativeInternal
} from "./narrativeStore";

import { computeChasePressure } from "../pressureEngine";
import { getMatchState, getEventStream } from "../matchEngine";
import { computeWinProbability } from "../winProbabilityEngine";
import { getMatchIntelligence } from "../analytics/matchIntelligenceGraphEngine";

export function resetNarrative(
  matchId: string,
  branchId: string
) {
  resetNarrativeInternal(matchId, branchId);
}

export function rebuildNarrativeFromStream(
  matchId: string,
  branchId: string,
  upToIndex?: number
) {
  resetNarrative(matchId, branchId);

  const timeline = getEventStream(matchId);
  const limit =
    upToIndex !== undefined
      ? Math.min(upToIndex, timeline.length - 1)
      : timeline.length - 1;

  for (let i = 0; i <= limit; i++) {

    const event = timeline[i];

    if (!event?.valid) continue;
    if (event.branchId !== branchId) continue;

    processNarrativeEvent(matchId, event);

  }
}

export function processNarrativeEvent(
  matchId: string,
  event: BallEvent
) {

  if (!event.valid) return;

  const branchId = event.branchId ?? "main";

  let state = getNarrativeState(matchId, branchId);

  if (!state) {
    resetNarrative(matchId, branchId);
    state = getNarrativeState(matchId, branchId)!;
  }

  let pressure = state.pressureScore;
  let momentum = state.momentumScore;

  /*
  ========================================
  EVENT-DRIVEN SCORE UPDATE
  ========================================
  */

  if (event.wicket) {
    pressure += 3;
    momentum -= 2;
  }

  if (event.type === "FOUR" || event.type === "SIX") {
    momentum += 2;
    pressure -= 1;
  }

  if (event.runs === 0 && event.isLegalDelivery) {
    pressure += 1;
  }

  pressure = Math.max(0, pressure);
  momentum = Math.max(0, momentum);

  /*
  ========================================
  ARC PRIORITY SYSTEM
  ========================================
  */

  let newArc: NarrativeArc = "NORMAL";

  // Collapse
  if (pressure >= 8 && event.wicket) {
    newArc = "COLLAPSE";
  }

  // Climax
  else if (momentum >= 8 || event.over >= 18) {
    newArc = "CLIMAX";
  }

  // Comeback
  else if (momentum >= 5 && pressure <= 2) {
    newArc = "COMEBACK";
  }

  // Momentum swing
  else if (momentum >= 5) {
    newArc = "MOMENTUM_SWING";
  }

  // Pressure build
  else if (pressure >= 5) {
    newArc = "PRESSURE_BUILD";
  }

  const previousArc = state.currentArc;

  const next: NarrativeState = {
    ...state,
    pressureScore: pressure,
    momentumScore: momentum,
    currentArc: newArc,
    lastEventId: event.id
  };

  setNarrativeState(matchId, branchId, next);

  /*
  ========================================
  MATCH INTELLIGENCE INTEGRATION
  ========================================
  */

  const intelligence = getMatchIntelligence(matchId);

  if (intelligence) {

    if (intelligence.phase === "COLLAPSE_RISK") {
      newArc = "COLLAPSE";
    }

    if (intelligence.phase === "BATTING_DOMINANCE") {
      newArc = "MOMENTUM_SWING";
    }

    if (intelligence.phase === "BOWLING_CONTROL") {
      newArc = "PRESSURE_BUILD";
    }

  }

  /*
  ========================================
  CHASE PRESSURE ANALYSIS
  ========================================
  */

  const matchState = getMatchState(matchId);

  const chase = matchState
    ? computeChasePressure(matchState)
    : null;

  if (chase) {

    if (chase.pressureIndex > 50) {
      newArc = "PRESSURE_BUILD";
    }

    if (
      chase.requiredRuns <= 15 &&
      chase.ballsRemaining <= 12
    ) {
      newArc = "CLIMAX";
    }

    if (
      chase.requiredRunRate < chase.currentRunRate &&
      chase.ballsRemaining < 30
    ) {
      newArc = "COMEBACK";
    }

  }

  /*
  ========================================
  WIN PROBABILITY SIGNAL
  ========================================
  */

  const winProb = matchState
    ? computeWinProbability(matchState)
    : null;

  if (winProb) {

    if (winProb.battingWinProbability < 30) {
      newArc = "COLLAPSE";
    }

    if (winProb.battingWinProbability > 70) {
      newArc = "COMEBACK";
    }

    if (
      winProb.battingWinProbability > 85 ||
      winProb.battingWinProbability < 15
    ) {
      newArc = "CLIMAX";
    }

  }

  /*
  ========================================
  ARC TRANSITION SIGNAL
  ========================================
  */

  if (previousArc !== newArc) {

    emitNarrativeSignal({
      type: "ARC_STARTED",
      matchId,
      branchId,
      arc: newArc,
      eventId: event.id
    });

  }

}