// directorMemory.ts

import { DirectorSignal } from "./directorSignals";

type MemoryState = {
  recentEvents: DirectorSignal[];
  boundaryStreak: number;
  lastWicketTimestamp: number | null;
};

const memory: MemoryState = {
  recentEvents: [],
  boundaryStreak: 0,
  lastWicketTimestamp: null
};

/*
================================================
RESET MEMORY (replay safe)
================================================
*/

export function resetDirectorMemory() {
  memory.recentEvents = [];
  memory.boundaryStreak = 0;
  memory.lastWicketTimestamp = null;
}

/*
================================================
UPDATE MEMORY
================================================
*/

export function updateDirectorMemory(signal: DirectorSignal) {

  // store last 10 signals
  memory.recentEvents.push(signal);

  if (memory.recentEvents.length > 10) {
    memory.recentEvents.shift();
  }

  // track boundary streak
  if (
    signal.type === "HIGHLIGHT_DETECTED" &&
    signal.subtype === "SIX"
  ) {
    memory.boundaryStreak++;
  } else {
    memory.boundaryStreak = 0;
  }

  // track wickets
  if (
    signal.type === "HIGHLIGHT_DETECTED" &&
    signal.subtype === "WICKET"
  ) {
    memory.lastWicketTimestamp = Date.now();
  }
}

/*
================================================
READ MEMORY
================================================
*/

export function getDirectorMemory() {
  return memory;
}