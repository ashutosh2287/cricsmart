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

/*
========================================
WICKET REPLAY
========================================
*/

/** Seek to the next wicket event after the given index. */
export async function seekNextWicket(matchId: string, afterIndex: number) {
  const cached = cache[matchId];
  if (!cached) return;

  const next = cached.highlights.wickets.find((i) => i > afterIndex);
  if (next !== undefined) {
    await replayTillIndex(matchId, cached.events, next);
  }
}

/** Seek to the previous wicket event before the given index. */
export async function seekPrevWicket(matchId: string, beforeIndex: number) {
  const cached = cache[matchId];
  if (!cached) return;

  const prev = [...cached.highlights.wickets]
    .reverse()
    .find((i) => i < beforeIndex);
  if (prev !== undefined) {
    await replayTillIndex(matchId, cached.events, prev);
  }
}

/** Seek to the next six-run event after the given index. */
export async function seekNextSix(matchId: string, afterIndex: number) {
  const cached = cache[matchId];
  if (!cached) return;

  const next = cached.highlights.sixes.find((i) => i > afterIndex);
  if (next !== undefined) {
    await replayTillIndex(matchId, cached.events, next);
  }
}

/** Seek to the beginning of an over (0-indexed over number). */
export async function seekToOver(matchId: string, overNumber: number) {
  const cached = cache[matchId];
  if (!cached) return;

  // Each over has up to 6 legal deliveries; find the first ball of the over
  const targetIndex = overNumber * 6;
  const clampedIndex = Math.min(targetIndex, cached.events.length - 1);
  await replayTillIndex(matchId, cached.events, clampedIndex);
}