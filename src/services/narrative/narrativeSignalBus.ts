import { DirectorSignal } from "../directorSignals";

const listeners = new Set<(signal: DirectorSignal) => void>();

export function subscribeDirectorSignal(
  cb: (signal: DirectorSignal) => void
) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function emitDirectorSignal(signal: DirectorSignal) {
  listeners.forEach((l) => l(signal));
}