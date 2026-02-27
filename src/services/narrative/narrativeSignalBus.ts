import { NarrativeSignal } from "./narrativeSignals";

const listeners = new Set<(signal: NarrativeSignal) => void>();

export function subscribeNarrativeSignal(
  cb: (signal: NarrativeSignal) => void
) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitNarrativeSignal(signal: NarrativeSignal) {
  listeners.forEach((l) => l(signal));
}