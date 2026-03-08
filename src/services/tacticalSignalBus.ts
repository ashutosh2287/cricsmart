export type TacticalSignal =
  | { type: "COLLAPSE_ALERT"; intensity: number }
  | { type: "ASSAULT_PHASE"; intensity: number }
  | { type: "STRANGLE_ALERT"; intensity: number }
  | { type: "PANIC_MODE"; intensity: number }
  | { type: "RECOVERY_PHASE"; intensity: number };

type TacticalListener = (signal: TacticalSignal) => void;

const listeners = new Set<TacticalListener>();

export function subscribeTacticalSignal(cb: TacticalListener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitTacticalSignal(signal: TacticalSignal) {
  listeners.forEach(l => l(signal));
}