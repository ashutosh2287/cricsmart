// directorMemory.ts

import { DirectorSignal } from "./directorSignals";

/*
================================================
MEMORY STATE
Stored per match + branch for replay safety
================================================
*/

type MemoryState = {
  recentEvents: DirectorSignal[];
  boundaryStreak: number;
  wicketStreak: number;
  lastWicketEventId: string | null;
};

const memory: Record<string, MemoryState> = {};

/*
================================================
RESET MEMORY
================================================
*/

export function resetDirectorMemory(
  matchId: string,
  branchId: string
) {
  const key = `${matchId}_${branchId}`;

  memory[key] = {
    recentEvents: [],
    boundaryStreak: 0,
    wicketStreak: 0,
    lastWicketEventId: null
  };
}

/*
================================================
GET MEMORY
================================================
*/

export function getDirectorMemory(
  matchId: string,
  branchId: string
) {

  const key = `${matchId}_${branchId}`;

  if (!memory[key]) {
    resetDirectorMemory(matchId, branchId);
  }

  return memory[key];
}

/*
================================================
UPDATE MEMORY
================================================
*/

export function updateDirectorMemory(
  signal: DirectorSignal
) {

  const key = `${signal.matchId}_${signal.branchId}`;

  if (!memory[key]) {
    resetDirectorMemory(signal.matchId, signal.branchId);
  }

  const state = memory[key];

  /*
  ----------------------------------------------
  STORE RECENT EVENTS
  ----------------------------------------------
  */

  state.recentEvents.push(signal);

  if (state.recentEvents.length > 10) {
    state.recentEvents.shift();
  }

  /*
  ----------------------------------------------
  BOUNDARY STREAK
  ----------------------------------------------
  */

  if (
    signal.type === "HIGHLIGHT_DETECTED" &&
    signal.subtype === "SIX"
  ) {
    state.boundaryStreak++;
  } else if (signal.type === "HIGHLIGHT_DETECTED") {
    state.boundaryStreak = 0;
  }

  /*
  ----------------------------------------------
  WICKET TRACKING
  ----------------------------------------------
  */

  if (
    signal.type === "HIGHLIGHT_DETECTED" &&
    signal.subtype === "WICKET"
  ) {
    state.wicketStreak++;
    state.lastWicketEventId = signal.eventId;
  }

}