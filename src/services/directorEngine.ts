// directorEngine.ts

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

/*
================================================
DIRECTOR STATE
================================================
*/

export type DirectorState = {
  branchId: string;
  lastEventId: string | null;
  pacing: "NORMAL" | "TENSION" | "CLIMAX";
  momentum: number;
};

let state: DirectorState = {
  branchId: "main",
  lastEventId: null,
  pacing: "NORMAL",
  momentum: 0
};

export function resetDirectorState(branchId: string) {
  resetCinematicCooldown();
  resetDirectorMemory();

  state = {
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

function processDirectorSignal(signal: DirectorSignal, emit: boolean) {

  // Update memory first
  updateDirectorMemory(signal);
  const memory = getDirectorMemory();

  // Update core metrics
  if (signal.type === "MOMENTUM_UPDATE") {
    state.momentum = signal.value;
  }

  /*
  ------------------------------------------------
  TENSION ENGINE
  ------------------------------------------------
  */

  /*
------------------------------------------------
TENSION ENGINE
------------------------------------------------
*/
const tension = updateTension(signal);
 

  /*
  ------------------------------------------------
  PACING STATE MACHINE (PURE)
  ------------------------------------------------
  */

  const nextPacing = computeNextPacing(state, signal);
   runPredictiveDirector(state, signal, tension);

  if (nextPacing !== state.pacing) {

    state.pacing = nextPacing;

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

      /*
      --------------------------------------------
      SIX LOGIC WITH MEMORY ESCALATION
      --------------------------------------------
      */

      if (signal.subtype === "SIX") {

        if (canTrigger("SIX_SHAKE", 1500)) {

          let intensity = 0.8;

          // Escalate based on streak memory
          if (memory.boundaryStreak >= 3) {
            intensity = 1;
          }

          if (state.pacing === "CLIMAX") {
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

      /*
      --------------------------------------------
      WICKET LOGIC
      --------------------------------------------
      */

      if (signal.subtype === "WICKET") {

        if (canTrigger("WICKET_SLOWMO", 2000)) {

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