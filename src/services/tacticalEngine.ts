import { getEventStream } from "./matchEngine";
import { computeStrategicContext } from "./strategicEngine";
import { computeChasePressure } from "./pressureEngine";
import { emitTacticalSignal } from "./tacticalSignalBus";
import type { MatchState } from "./matchEngine";

const lastPhase: Record<string, string> = {};

/*
================================================
TACTICAL ENGINE
Detects strategic phase transitions
================================================
*/

export function runTacticalEngine(
  matchId: string,
  state: MatchState
) {

  const events = getEventStream(matchId);
  const chase = computeChasePressure(state);

  const context = computeStrategicContext(events, chase);

  const previous = lastPhase[matchId];

  if (previous === context.phase) return;

  lastPhase[matchId] = context.phase;

  switch (context.phase) {

    case "COLLAPSE":
      emitTacticalSignal({
        type: "COLLAPSE_ALERT",
        intensity: context.intensity
      });
      break;

    case "ASSAULT":
      emitTacticalSignal({
        type: "ASSAULT_PHASE",
        intensity: context.intensity
      });
      break;

    case "STRANGLE":
      emitTacticalSignal({
        type: "STRANGLE_ALERT",
        intensity: context.intensity
      });
      break;

    case "PANIC":
      emitTacticalSignal({
        type: "PANIC_MODE",
        intensity: context.intensity
      });
      break;

    case "STABILIZING":
      emitTacticalSignal({
        type: "RECOVERY_PHASE",
        intensity: context.intensity
      });
      break;
  }
}