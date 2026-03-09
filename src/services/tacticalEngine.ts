import { getEventStream } from "./matchEngine";
import { computeStrategicContext } from "./strategicEngine";
import { computeChasePressure } from "./pressureEngine";
import { emitTacticalSignal } from "./tacticalSignalBus";
import type { MatchState } from "./matchEngine";

/*
================================================
TACTICAL ENGINE MEMORY
Branch-safe phase tracking
================================================
*/

type TacticalMemory = {
  lastPhase?: string;
};

const memory: Record<string, TacticalMemory> = {};

/*
================================================
TACTICAL ENGINE
Detects strategic phase transitions
================================================
*/

export function runTacticalEngine(
  matchId: string,
  branchId: string,
  state: MatchState
) {

  const events = getEventStream(matchId);

  if (!events.length) return;

  const lastEvent = events[events.length - 1];

  const chase = computeChasePressure(state);

  const context = computeStrategicContext(events, chase);

  const key = `${matchId}_${branchId}`;

  if (!memory[key]) {
    memory[key] = {};
  }

  const previous = memory[key].lastPhase;

  if (previous === context.phase) return;

  memory[key].lastPhase = context.phase;

  /*
  ================================================
  EMIT TACTICAL SIGNAL
  ================================================
  */

  switch (context.phase) {

    case "COLLAPSE":

      emitTacticalSignal({
        type: "COLLAPSE_ALERT",
        matchId,
        branchId,
        eventId: lastEvent.id,
        intensity: context.intensity
      });

      break;

    case "ASSAULT":

      emitTacticalSignal({
        type: "ASSAULT_PHASE",
        matchId,
        branchId,
        eventId: lastEvent.id,
        intensity: context.intensity
      });

      break;

    case "STRANGLE":

      emitTacticalSignal({
        type: "STRANGLE_ALERT",
        matchId,
        branchId,
        eventId: lastEvent.id,
        intensity: context.intensity
      });

      break;

    case "PANIC":

      emitTacticalSignal({
        type: "PANIC_MODE",
        matchId,
        branchId,
        eventId: lastEvent.id,
        intensity: context.intensity
      });

      break;

    case "STABILIZING":

      emitTacticalSignal({
        type: "RECOVERY_PHASE",
        matchId,
        branchId,
        eventId: lastEvent.id,
        intensity: context.intensity
      });

      break;
  }
}