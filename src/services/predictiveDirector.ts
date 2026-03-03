// predictiveDirector.ts

import { DirectorState } from "./directorEngine";
import { DirectorSignal } from "./directorSignals";
import { emitBroadcastCommand } from "./broadcastCommands";
import type { ProbabilitySwing } from "./probabilitySwingEngine";

let lastPredictionTime = 0;

/*
================================================
BRANCH-AWARE PREDICTIVE DIRECTOR
================================================
*/

export function runPredictiveDirector(
  state: DirectorState,
  signal: DirectorSignal,
  tension: number,
  pressureIndex?: number,
  swing?: ProbabilitySwing | null
) {

  // Branch safety
  if (
    signal.branchId &&
    signal.branchId !== state.branchId
  ) {
    return;
  }

  const now = Date.now();

  // Cooldown protection
  if (now - lastPredictionTime < 2000) return;

  /*
  ================================================
  SHOCK EVENT HANDLING
  ================================================
  */

  if (swing?.intensity === "SHOCK") {

    emitBroadcastCommand({
      type: "CAMERA_SHAKE",
      intensity: 0.6
    });

    emitBroadcastCommand({
      type: "SHOW_OVERLAY",
      overlay: "MOMENTUM_SHIFT"
    });

    lastPredictionTime = now;
    return;
  }

  /*
  ================================================
  HIGH VOLATILITY BUILDUP
  ================================================
  */

  if (
    swing &&
    swing.volatilityScore > 50 &&
    state.pacing !== "CLIMAX"
  ) {

    emitBroadcastCommand({
      type: "CAMERA_SWEEP",
      slug: "volatility-rise"
    });

    lastPredictionTime = now;
    return;
  }

  /*
  ================================================
  PRESSURE ESCALATION
  ================================================
  */

  if (
    pressureIndex !== undefined &&
    pressureIndex > 65 &&
    state.pacing === "TENSION"
  ) {

    emitBroadcastCommand({
      type: "CAMERA_SWEEP",
      slug: "pressure-rise"
    });

    lastPredictionTime = now;
    return;
  }

  /*
  ================================================
  CLIMAX ANTICIPATION
  ================================================
  */

  if (
    state.pacing === "CLIMAX" &&
    tension > 80
  ) {

    emitBroadcastCommand({
      type: "CAMERA_SHAKE",
      intensity: 0.3
    });

    lastPredictionTime = now;
  }
}