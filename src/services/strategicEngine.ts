// strategicEngine.ts

import { BallEvent } from "@/types/ballEvent";
import type { ChaseContext } from "./pressureEngine";

export type StrategicPhase =
  | "COLLAPSE"
  | "ASSAULT"
  | "STRANGLE"
  | "PANIC"
  | "STABILIZING"
  | "NONE";

export type StrategicContext = {
  phase: StrategicPhase;
  intensity: number; // 0–100
};

/*
================================================
STRATEGIC PATTERN DETECTION
Analyzes last 12–18 legal deliveries
Deterministic + Replay Safe
================================================
*/

export function computeStrategicContext(
  events: BallEvent[],
  chase?: ChaseContext | null
): StrategicContext {

  const recent = events
    .filter(e => e.isLegalDelivery)
    .slice(-18);

  if (recent.length < 6) {
    return { phase: "NONE", intensity: 0 };
  }

  let runs = 0;
  let wickets = 0;
  let dots = 0;
  let boundaries = 0;

  for (const e of recent) {
    runs += e.runs;
    if (e.wicket) wickets++;
    if (e.runs === 0) dots++;
    if (e.runs === 4 || e.runs === 6) boundaries++;
  }

  const runRate = (runs / recent.length) * 6;

  /*
  ====================================================
  PHASE DETECTION RULES
  ====================================================
  */

  // COLLAPSE → 2+ wickets recently
  if (wickets >= 2) {
    return {
      phase: "COLLAPSE",
      intensity: Math.min(100, wickets * 35)
    };
  }

  // ASSAULT → explosive scoring
  if (runRate > 10 || boundaries >= 4) {
    return {
      phase: "ASSAULT",
      intensity: Math.min(100, runRate * 5)
    };
  }

  // STRANGLE → dot pressure
  if (dots >= 10) {
    return {
      phase: "STRANGLE",
      intensity: Math.min(100, dots * 5)
    };
  }

  // PANIC → high RRR + dot pressure
  if (
    chase &&
    chase.requiredRunRate > 12 &&
    dots >= 6
  ) {
    return {
      phase: "PANIC",
      intensity: Math.min(100, chase.requiredRunRate * 4)
    };
  }

  // STABILIZING → steady scoring without wickets
  if (
    wickets === 0 &&
    runRate >= 6 &&
    runRate <= 8
  ) {
    return {
      phase: "STABILIZING",
      intensity: Math.min(100, runRate * 8)
    };
  }

  return { phase: "NONE", intensity: 0 };
}