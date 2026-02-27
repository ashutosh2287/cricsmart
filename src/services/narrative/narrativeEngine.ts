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
import { getMatchState } from "../matchEngine";
import { getEventStream } from "../matchEngine";
import { computeWinProbability } from "../winProbabilityEngine";

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

  // ------------------------------
  // SCORE UPDATE (DETERMINISTIC)
  // ------------------------------

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

  // ------------------------------
  // ARC PRIORITY SYSTEM
  // Highest → Lowest
  // ------------------------------

  let newArc: NarrativeArc = "NORMAL";

  // 1️⃣ Collapse (highest priority)
  if (pressure >= 8 && event.wicket) {
    newArc = "COLLAPSE";
  }

  // 2️⃣ Climax (death over OR extreme momentum)
  else if (momentum >= 8 || event.over >= 18) {
    newArc = "CLIMAX";
  }

  // 3️⃣ Comeback
  else if (momentum >= 5 && pressure <= 2) {
    newArc = "COMEBACK";
  }

  // 4️⃣ Momentum swing
  else if (momentum >= 5) {
    newArc = "MOMENTUM_SWING";
  }

  // 5️⃣ Pressure build
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
  const matchState = getMatchState(matchId);
const chase = matchState
  ? computeChasePressure(matchState)
  : null;

if (chase) {

  // High chase pressure
  if (chase.pressureIndex > 50) {
    newArc = "PRESSURE_BUILD";
  }
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

  // Extreme end-game
  if (
    chase.requiredRuns <= 15 &&
    chase.ballsRemaining <= 12
  ) {
    newArc = "CLIMAX";
  }

  // Comeback detection
  if (
    chase.requiredRunRate < chase.currentRunRate &&
    chase.ballsRemaining < 30
  ) {
    newArc = "COMEBACK";
  }
}

  // ------------------------------
  // ARC TRANSITION SIGNAL
  // ------------------------------

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