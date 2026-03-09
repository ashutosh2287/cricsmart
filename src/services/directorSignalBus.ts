// directorSignalBus.ts

import { DirectorSignal } from "./directorSignals";
import { subscribeTacticalSignal } from "./tacticalSignalBus";

/*
================================================
LISTENER SYSTEM
================================================
*/

type Listener = (signal: DirectorSignal) => void;

const listeners = new Set<Listener>();

/*
================================================
SUBSCRIBE
Director engine uses this.
================================================
*/

export function subscribeDirectorSignal(
  listener: Listener
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/*
================================================
EMIT DIRECTOR SIGNAL
Used by analytics engines
================================================
*/

export function emitDirectorSignal(
  signal: DirectorSignal
) {
  for (const listener of listeners) {
    listener(signal);
  }
}

/*
================================================
TACTICAL → DIRECTOR BRIDGE
Strategic phases become director signals
================================================
*/

export function initDirectorSignalBridge() {

  subscribeTacticalSignal((signal) => {

    emitDirectorSignal({
      type: signal.type,
      matchId: signal.matchId,
      branchId: signal.branchId,
      eventId: signal.eventId,
      intensity: signal.intensity
    });

  });

}