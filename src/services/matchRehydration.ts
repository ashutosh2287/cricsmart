import { eventStore } from "@/persistence/eventStore";

import {
  initMatch,
  hydrateMatchState,
  getMatchState,
  reduceStateOnly,
  setEventStream
} from "@/services/matchEngine";

import { BallEvent } from "@/types/ballEvent";

export async function rehydrateMatch(matchId: string): Promise<void> {

  initMatch(matchId);

  const snapshot = await eventStore.loadLatestSnapshot(matchId);

  if (snapshot) {
    hydrateMatchState(matchId, snapshot);
  }

  const events: BallEvent[] = await eventStore.loadEvents(matchId);

  // ⭐ Restore canonical stream
  setEventStream(matchId, events);

  let state = getMatchState(matchId);

  if (!state) return;

  // rebuild deterministic projection
  for (const event of events) {

    if (!event.valid) continue;

    state = reduceStateOnly(state, event);
  }

  hydrateMatchState(matchId, state);
}