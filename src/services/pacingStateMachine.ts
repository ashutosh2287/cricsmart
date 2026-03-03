// pacingStateMachine.ts

import { DirectorState } from "./directorEngine";
import { DirectorSignal } from "./directorSignals";
import { getDirectorProfileConfig } from "./directorProfile";

export type Pacing = "NORMAL" | "TENSION" | "CLIMAX";

/*
================================================
PACING STATE MACHINE
PURE + PROFILE AWARE + DEATH MODE LOCK
================================================
*/

export function computeNextPacing(
  state: DirectorState,
  signal: DirectorSignal,
  tension: number,
  pressureIndex?: number,
  deathLevel?: "NONE" | "EARLY_DEATH" | "CRITICAL" | "FINAL_OVER"
): Pacing {

  const profile = getDirectorProfileConfig();
  const current = state.pacing;

  /*
  ====================================================
  PROFILE-DERIVED THRESHOLDS
  ====================================================
  */

  const climaxThreshold = profile.climaxThreshold;
  const tensionThreshold = Math.max(30, climaxThreshold - 30);
  const downgradeThreshold = Math.max(20, tensionThreshold - 20);

  /*
  ====================================================
  FINAL OVER CLIMAX LOCK
  ====================================================
  */

  if (
    deathLevel === "FINAL_OVER" &&
    pressureIndex !== undefined &&
    pressureIndex > 80
  ) {
    return "CLIMAX";
  }

  /*
  ====================================================
  HARD EVENT OVERRIDES
  ====================================================
  */

  if (
    signal.type === "HIGHLIGHT_DETECTED" &&
    signal.subtype === "WICKET"
  ) {
    return "CLIMAX";
  }

  /*
  ====================================================
  CLIMAX LOGIC
  ====================================================
  */

  if (current === "CLIMAX") {

    // Death mode: harder to downgrade
    if (deathLevel === "FINAL_OVER") {
      if (tension < downgradeThreshold) {
        return "TENSION";
      }
      return "CLIMAX";
    }

    if (tension < downgradeThreshold) {
      return "TENSION";
    }

    return "CLIMAX";
  }

  /*
  ====================================================
  TENSION LOGIC
  ====================================================
  */

  if (current === "TENSION") {

    if (tension > climaxThreshold) {
      return "CLIMAX";
    }

    if (tension < downgradeThreshold) {
      return "NORMAL";
    }

    return "TENSION";
  }

  /*
  ====================================================
  NORMAL LOGIC
  ====================================================
  */

  if (current === "NORMAL") {

    if (tension > climaxThreshold) {
      return "CLIMAX";
    }

    if (tension > tensionThreshold) {
      return "TENSION";
    }

    return "NORMAL";
  }

  return current;
} 