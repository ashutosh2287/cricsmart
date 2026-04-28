import { loadHistoricalMatch } from "./loadHistoricalMatch";
import {
  startReplay,
  stopReplay,
  replayTillIndex,
} from "./replayEngine";

import { BallEvent } from "@/types/ballEvent";

type Cached = {
  events: BallEvent[];
  highlights: {
    wickets: number[];
    sixes: number[];
  };
};

const cache: Record<string, Cached> = {};

/*
========================================
LOAD EVENTS (ONCE)
========================================
*/

export async function initReplay(matchId: string) {
  if (!cache[matchId]) {
    const events = await loadHistoricalMatch(matchId);

    const wickets: number[] = [];
    const sixes: number[] = [];

    events.forEach((e, i) => {
      if (e.type === "WICKET" || e.wicket) wickets.push(i);
      if (e.runs === 6) sixes.push(i);
    });

    cache[matchId] = {
      events,
      highlights: { wickets, sixes },
    };
  }
}

/*
========================================
GETTERS
========================================
*/

export function getReplayEvents(matchId: string) {
  return cache[matchId]?.events ?? [];
}

export function getHighlights(matchId: string) {
  return cache[matchId]?.highlights ?? {
    wickets: [],
    sixes: [],
  };
}

/*
========================================
PLAY
========================================
*/

export function playReplay(matchId: string) {
  const cached = cache[matchId];
  if (!cached) return;

  startReplay(matchId, cached.events); // ✅ FIXED
}

/*
========================================
STOP
========================================
*/

export function stopReplayUI(matchId: string) {
  stopReplay(matchId);
}

/*
========================================
SEEK
========================================
*/

export async function seekReplayUI(
  matchId: string,
  index: number
) {
  const cached = cache[matchId];
  if (!cached) return;

  await replayTillIndex(matchId, cached.events, index); // ✅ FIXED
}