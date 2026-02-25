// predictiveDirector.ts

import { DirectorState } from "./directorEngine";
import { DirectorSignal } from "./directorSignals";
import { getDirectorMemory } from "./directorMemory";
import { emitBroadcastCommand } from "./broadcastCommands";

let lastPredictionTime = 0;

/*
================================================
BRANCH-AWARE PREDICTIVE DIRECTOR
================================================
*/

export function runPredictiveDirector(
  state: DirectorState,
  signal: DirectorSignal,
  tension: number
) {

  /*
  --------------------------------------------
  BRANCH SAFETY
  --------------------------------------------
  */

  if (
    signal.branchId &&
    signal.branchId !== state.branchId
  ) {
    return; // ignore signals from other timelines
  }

  const now = Date.now();

  // cooldown protection
  if (now - lastPredictionTime < 2000) return;

  const memory = getDirectorMemory();

  /*
  ================================================
  Predict pressure buildup
  ================================================
  */

  if (
    state.pacing === "TENSION" &&
    tension > 40 &&
    memory.boundaryStreak === 0
  ) {

    emitBroadcastCommand({
      type: "CAMERA_SWEEP",
      slug: "predictive"
    });

    lastPredictionTime = now;
  }

  /*
  ================================================
  Predict climax buildup
  ================================================
  */

  if (
    state.pacing === "CLIMAX" &&
    tension > 80
  ) {

    emitBroadcastCommand({
      type: "CAMERA_SHAKE",
      intensity: 0.3 // subtle anticipation shake
    });

    lastPredictionTime = now;
  }
}