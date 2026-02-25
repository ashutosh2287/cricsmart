// directorEngine.ts

import { subscribeDirectorSignal } from "./directorSignalBus";
import { DirectorSignal } from "./directorSignals";
import { emitBroadcastCommand } from "./broadcastCommands";

/*
================================================
DIRECTOR STATE
================================================
*/

type DirectorState = {
  branchId: string;
  lastEventId: string | null;
  pacing: "NORMAL" | "TENSION" | "CLIMAX";
  momentum: number;
};

const state: DirectorState = {
  branchId: "main",
  lastEventId: null,
  pacing: "NORMAL",
  momentum: 0
};

/*
================================================
DIRECTOR SIGNAL HANDLER
================================================
*/

function handleSignal(signal: DirectorSignal) {

  switch (signal.type) {

    /*
    --------------------------------------------
    ANALYTICS SIGNALS
    --------------------------------------------
    */

    case "MOMENTUM_UPDATE":

      state.momentum = signal.value;

      // pacing logic example
      if (state.momentum > 15 && state.pacing !== "CLIMAX") {
        state.pacing = "CLIMAX";

        emitBroadcastCommand({
          type: "ENTER_TENSION"
        });
      }

      break;

    case "PRESSURE_SPIKE":

      emitBroadcastCommand({
  type: "CAMERA_SWEEP",
  slug: signal.eventId
});

      break;

    /*
    --------------------------------------------
    HIGHLIGHT SIGNALS
    --------------------------------------------
    */

    case "HIGHLIGHT_DETECTED":

      if (signal.subtype === "SIX") {

        emitBroadcastCommand({
          type: "CAMERA_SHAKE",
          intensity: 0.9
        });

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "BIG_SIX"
        });

      }

      if (signal.subtype === "WICKET") {

        emitBroadcastCommand({
  type: "PLAY_SLOW_MOTION",
  slug: signal.eventId
});

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "WICKET"
        });

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

  subscribeDirectorSignal(handleSignal);

}