// tensionEngine.ts

import { DirectorSignal } from "./directorSignals";
import type { ProbabilitySwing } from "./probabilitySwingEngine";
import type { DeathLevel } from "./pressureEngine";
import type { MomentumContext } from "./momentumContextEngine";
import { getDirectorProfileConfig } from "./directorProfile";
import type { StrategicContext } from "./strategicEngine";

type TensionState = {
  score: number;
};

const tension: TensionState = {
  score: 0
};

/*
================================================
RESET (replay rebuild safe)
================================================
*/

export function resetTension() {
  tension.score = 0;
}

/*
================================================
UPDATE TENSION
Deterministic + Intelligence-aware + Death Bias
================================================
*/

export function updateTension(
  signal: DirectorSignal,
  swing?: ProbabilitySwing | null,
  pressureIndex?: number,
  deathLevel?: DeathLevel,
  momentum?: MomentumContext,
  strategic?: StrategicContext
): number {

  /*
  --------------------------------------------
  BASE EVENT REACTIONS
  --------------------------------------------
  */

  switch (signal.type) {

    case "MOMENTUM_UPDATE":
      tension.score += signal.value * 0.2;
      break;

    case "PRESSURE_SPIKE":
      tension.score += 5;
      break;

    case "HIGHLIGHT_DETECTED":

      if (signal.subtype === "WICKET") {
        tension.score += 10;
      }

      if (signal.subtype === "SIX") {
        tension.score += 6;
      }

      break;
  }

  /*
  --------------------------------------------
  SWING INFLUENCE
  --------------------------------------------
  */

  if (swing) {

    switch (swing.intensity) {

      case "MINOR":
        tension.score += 2;
        break;

      case "MODERATE":
        tension.score += 5;
        break;

      case "MAJOR":
        tension.score += 10;
        break;

      case "SHOCK":
        tension.score += 18;
        break;
    }
  }

  /*
  --------------------------------------------
  PRESSURE ESCALATION
  --------------------------------------------
  */

  if (pressureIndex !== undefined) {

    if (pressureIndex > 75) {
      tension.score += 8;
    } else if (pressureIndex > 60) {
      tension.score += 5;
    } else if (pressureIndex > 40) {
      tension.score += 3;
    }
  }

  /*
  --------------------------------------------
  🆕 DEATH MODE BIAS
  --------------------------------------------
  */

  if (deathLevel) {

    switch (deathLevel) {

      case "EARLY_DEATH":
        tension.score += 4;
        break;

      case "CRITICAL":
        tension.score += 8;
        break;

      case "FINAL_OVER":
        tension.score += 15;
        break;
    }
  }

  /*
--------------------------------------------
MINI MOMENTUM BOOST
--------------------------------------------
*/

if (momentum) {

  switch (momentum.arc) {

    case "SURGE":
      tension.score += 6;
      break;

    case "COLLAPSE":
      tension.score += 12;
      break;

    case "STALL":
      tension.score += 4;
      break;
  }
}
/*
--------------------------------------------
STRATEGIC PHASE BOOST
--------------------------------------------
*/

if (strategic) {

  switch (strategic.phase) {

    case "COLLAPSE":
      tension.score += 15;
      break;

    case "ASSAULT":
      tension.score += 8;
      break;

    case "STRANGLE":
      tension.score += 6;
      break;

    case "PANIC":
      tension.score += 12;
      break;

    case "STABILIZING":
      tension.score += 4;
      break;
  }
}

  /*
  --------------------------------------------
  NATURAL DECAY (slower in death)
  --------------------------------------------
  */

  const decay =
    deathLevel === "FINAL_OVER" ? 0.97 :
    deathLevel === "CRITICAL" ? 0.95 :
    0.94;

  tension.score *= decay;

  /*
  --------------------------------------------
  CLAMP SAFETY
  --------------------------------------------
  */

  const profile = getDirectorProfileConfig();

tension.score *= profile.tensionMultiplier;

tension.score = Math.max(
  0,
  Math.min(100, tension.score)
);

  return tension.score;
}