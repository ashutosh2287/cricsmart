/*
================================================
TACTICAL SIGNAL TYPES
================================================
*/

export type TacticalSignal =
  | {
      type: "COLLAPSE_ALERT";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }
  | {
      type: "ASSAULT_PHASE";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }
  | {
      type: "STRANGLE_ALERT";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }
  | {
      type: "PANIC_MODE";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    }
  | {
      type: "RECOVERY_PHASE";
      matchId: string;
      branchId: string;
      eventId: string;
      intensity: number;
    };

/*
================================================
LISTENER SYSTEM
================================================
*/

type TacticalListener = (signal: TacticalSignal) => void;

const listeners = new Set<TacticalListener>();

/*
================================================
SUBSCRIBE
================================================
*/

export function subscribeTacticalSignal(
  cb: TacticalListener
) {
  listeners.add(cb);

  return () => {
    listeners.delete(cb);
  };
}

/*
================================================
EMIT SIGNAL
================================================
*/

export function emitTacticalSignal(
  signal: TacticalSignal
) {

  for (const listener of listeners) {
    listener(signal);
  }

}