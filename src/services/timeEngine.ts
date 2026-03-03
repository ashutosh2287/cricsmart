// timeEngine.ts

type ClockState = {
  tick: number;
};

const clocks: Record<string, ClockState> = {};

/*
================================================
INIT CLOCK
================================================
*/

export function initClock(matchId: string) {
  clocks[matchId] = { tick: 0 };
}

/*
================================================
ADVANCE CLOCK
Called once per committed event.
================================================
*/

export function advanceClock(matchId: string) {
  if (!clocks[matchId]) {
    initClock(matchId);
  }

  clocks[matchId].tick += 1;
}

/*
================================================
GET CURRENT TICK
================================================
*/

export function getCurrentTick(matchId: string): number {
  return clocks[matchId]?.tick ?? 0;
}

/*
================================================
RESET CLOCK (replay / branch switch)
================================================
*/

export function resetClock(matchId: string) {
  clocks[matchId] = { tick: 0 };
}