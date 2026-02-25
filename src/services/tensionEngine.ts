// tensionEngine.ts

import { DirectorSignal } from "./directorSignals";

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
PURE LOGIC
================================================
*/

export function updateTension(signal: DirectorSignal): number {

  switch (signal.type) {

    case "MOMENTUM_UPDATE":

      // momentum contributes lightly
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

  // natural decay
  tension.score *= 0.95;

  // clamp
  tension.score = Math.max(0, Math.min(100, tension.score));

  return tension.score;
}