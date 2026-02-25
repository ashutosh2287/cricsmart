// directorSignalBus.ts

import { DirectorSignal } from "./directorSignals";

type Listener = (signal: DirectorSignal) => void;

const listeners: Listener[] = [];

/*
-------------------------------------------------------
SUBSCRIBE
Director engine will use this.
-------------------------------------------------------
*/
export function subscribeDirectorSignal(listener: Listener) {
  listeners.push(listener);
}

/*
-------------------------------------------------------
EMIT SIGNAL
Analytics + Highlight engines use this.
-------------------------------------------------------
*/
export function emitDirectorSignal(signal: DirectorSignal) {
  for (const listener of listeners) {
    listener(signal);
  }
}