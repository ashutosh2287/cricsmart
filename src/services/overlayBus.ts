export type OverlayEvent =
  | { type: "TACTICAL_COLLAPSE"; intensity: number }
  | { type: "TACTICAL_ASSAULT"; intensity: number }
  | { type: "TACTICAL_STRANGLE"; intensity: number }
  | { type: "TACTICAL_PANIC"; intensity: number }
  | { type: "TACTICAL_RECOVERY"; intensity: number };

type Listener = (event: OverlayEvent) => void;

const listeners = new Set<Listener>();

export function subscribeOverlay(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitOverlay(event: OverlayEvent) {
  listeners.forEach(l => l(event));
}