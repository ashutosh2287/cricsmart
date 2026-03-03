// directorEngine.ts

import { getNarrativeState } from "./narrative/narrativeEngine";
import { subscribeDirectorSignal } from "./directorSignalBus";
import { DirectorSignal } from "./directorSignals";
import { emitBroadcastCommand } from "./broadcastCommands";
import { computeNextPacing } from "./pacingStateMachine";
import { canTrigger, resetCinematicCooldown } from "./cinematicCooldown";
import { updateTension } from "./tensionEngine";
import {
  updateDirectorMemory,
  getDirectorMemory,
  resetDirectorMemory
} from "./directorMemory";
import { runPredictiveDirector } from "./predictiveDirector";
import { runPredictiveCommentary } from "./commentary/predictiveCommentary";

import { getMatchState } from "./matchEngine";
import { computeWinProbability } from "./winProbabilityEngine";
import { computeProbabilitySwing } from "./probabilitySwingEngine";
import { computeChasePressure } from "./pressureEngine";
import { computeMomentumContext } from "./momentumContextEngine";
import { getEventStream } from "./matchEngine";
import { computeStrategicContext } from "./strategicEngine";

/*
================================================
DIRECTOR STATE
================================================
*/

export type DirectorState = {
  matchId: string;
  branchId: string;
  lastEventId: string | null;
  pacing: "NORMAL" | "TENSION" | "CLIMAX";
  momentum: number;
};

let state: DirectorState = {
  matchId: "",
  branchId: "main",
  lastEventId: null,
  pacing: "NORMAL",
  momentum: 0
};

// Probability memory (deterministic per timeline)
let lastProbability: number | null = null;

export function resetDirectorState(
  matchId: string,
  branchId: string
) {
  resetCinematicCooldown();
  resetDirectorMemory();

  lastProbability = null;

  state = {
    matchId,
    branchId,
    lastEventId: null,
    pacing: "NORMAL",
    momentum: 0
  };
}

/*
================================================
CORE DIRECTOR PROCESSOR
Deterministic.
emit = false during replay rebuild.
================================================
*/

function processDirectorSignal(
  signal: DirectorSignal,
  emit: boolean
) {

  // Branch safety
  if (
    signal.branchId &&
    signal.branchId !== state.branchId
  ) {
    return;
  }

  // Update memory first
  updateDirectorMemory(signal);
  const memory = getDirectorMemory();

  // Narrative awareness (read-only)
  const narrative = getNarrativeState(
    state.matchId,
    state.branchId
  );

  // Update momentum
  if (signal.type === "MOMENTUM_UPDATE") {
    state.momentum = signal.value;
  }

 /*
------------------------------------------------
WIN PROBABILITY + SWING + PRESSURE + DEATH
------------------------------------------------
*/

let swing = null;
let pressureIndex: number | undefined = undefined;
let deathLevel = undefined;

const matchState = getMatchState(state.matchId);

if (matchState) {

  const probability = computeWinProbability(matchState);

  if (probability) {

    swing = computeProbabilitySwing(
      lastProbability,
      matchState
    );

    lastProbability =
      probability.battingWinProbability;
  }

  const chase = computeChasePressure(matchState);

  if (chase) {
    pressureIndex = chase.pressureIndex;
    deathLevel = chase.deathLevel; // ✅ declared in same scope
  }
}
let momentumContext = undefined;

if (matchState) {
  const events = getEventStream(state.matchId);
  momentumContext = computeMomentumContext(events);
}

let strategicContext = undefined;

if (matchState) {

  const events = getEventStream(state.matchId);

  const chase = computeChasePressure(matchState);

  strategicContext = computeStrategicContext(
    events,
    chase
  );
}
/*
------------------------------------------------
TENSION ENGINE
------------------------------------------------
*/

const tension = updateTension(
  signal,
  swing,
  pressureIndex,
  deathLevel,
  momentumContext,
  strategicContext
);
  /*
  ------------------------------------------------
  PACING STATE MACHINE (PURE)
  ------------------------------------------------
  */

 const nextPacing = computeNextPacing(
  state,
  signal,
  tension,
  pressureIndex,
  
);
  let adjustedPacing = nextPacing;

  if (narrative) {

    if (narrative.currentArc === "CLIMAX") {
      adjustedPacing = "CLIMAX";
    }

    if (
      narrative.currentArc === "PRESSURE_BUILD" &&
      adjustedPacing === "NORMAL"
    ) {
      adjustedPacing = "TENSION";
    }

    if (narrative.currentArc === "COLLAPSE") {
      adjustedPacing = "CLIMAX";
    }
  }

  /*
  ------------------------------------------------
  PREDICTIVE INTELLIGENCE LAYER
  ------------------------------------------------
  */

  runPredictiveDirector(
    state,
    signal,
    tension,
    pressureIndex,
    swing
  );

  runPredictiveCommentary(
    state.matchId,
    state.branchId,
    state,
    signal.eventId
  );

  if (adjustedPacing !== state.pacing) {

    state.pacing = adjustedPacing;

    if (emit) {

      if (state.pacing === "TENSION") {
        emitBroadcastCommand({ type: "ENTER_TENSION" });
      }

      if (state.pacing === "CLIMAX") {
        emitBroadcastCommand({
          type: "CAMERA_SHAKE",
          intensity: 1
        });
      }
    }
  }

  /*
  ------------------------------------------------
  Skip cinematic output during rebuild
  ------------------------------------------------
  */

  if (!emit) {
    state.lastEventId = signal.eventId;
    return;
  }

  /*
  ------------------------------------------------
  CINEMATIC REACTIONS
  ------------------------------------------------
  */

  switch (signal.type) {

    case "PRESSURE_SPIKE":

      if (state.pacing === "TENSION") {
        emitBroadcastCommand({
          type: "CAMERA_SWEEP",
          slug: signal.eventId
        });
      }

      break;

    case "HIGHLIGHT_DETECTED":

      // SIX LOGIC
      if (signal.subtype === "SIX") {

        if (
  canTrigger(
  state.matchId,
  "SIX_SHAKE",
  3,
  tension,
  swing?.intensity
)
) {

          let intensity = 0.8;

          if (memory.boundaryStreak >= 3) {
            intensity = 1;
          }

          if (state.pacing === "CLIMAX") {
            intensity = 1;
          }

          if (narrative?.currentArc === "CLIMAX") {
            intensity = 1;
          }

          emitBroadcastCommand({
            type: "CAMERA_SHAKE",
            intensity
          });

          emitBroadcastCommand({
            type: "SHOW_OVERLAY",
            overlay: "BIG_SIX"
          });
        }
      }

      // WICKET LOGIC
      if (signal.subtype === "WICKET") {

        if (
  canTrigger(
    state.matchId,
    "WICKET_SLOWMO",
    2,
    tension,
    swing?.intensity
  )
) {

          emitBroadcastCommand({
            type: "PLAY_SLOW_MOTION",
            slug: signal.eventId
          });

          emitBroadcastCommand({
            type: "SHOW_OVERLAY",
            overlay: "WICKET"
          });
        }
      }

      break;
  }

  state.lastEventId = signal.eventId;
}

/*
================================================
INIT DIRECTOR ENGINE
================================================
*/

export function initDirectorEngine() {
  subscribeDirectorSignal((signal) => {
    processDirectorSignal(signal, true);
  });
}