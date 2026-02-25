// pacingStateMachine.ts

import { DirectorState } from "./directorEngine";
import { DirectorSignal } from "./directorSignals";

export type Pacing = "NORMAL" | "TENSION" | "CLIMAX";

/*
================================================
PACING STATE MACHINE
PURE FUNCTION — DETERMINISTIC
================================================
*/

export function computeNextPacing(
  state: DirectorState,
  signal: DirectorSignal
): Pacing {

  switch (state.pacing) {

    /*
    ================================================
    NORMAL MODE
    ================================================
    */

    case "NORMAL":

      if (signal.type === "PRESSURE_SPIKE") {
        return "TENSION";
      }

      if (
        signal.type === "HIGHLIGHT_DETECTED" &&
        signal.subtype === "WICKET"
      ) {
        return "CLIMAX";
      }

      return "NORMAL";

    /*
    ================================================
    TENSION MODE
    ================================================
    */

    case "TENSION":

      if (
        signal.type === "HIGHLIGHT_DETECTED" &&
        (signal.subtype === "SIX" || signal.subtype === "WICKET")
      ) {
        return "CLIMAX";
      }

      return "TENSION";

    /*
    ================================================
    CLIMAX MODE
    ================================================
    */

    case "CLIMAX":

      // cooldown back to normal after momentum drop
      if (
        signal.type === "MOMENTUM_UPDATE" &&
        signal.value < 3
      ) {
        return "NORMAL";
      }

      return "CLIMAX";
  }
}