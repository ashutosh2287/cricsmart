import { eventStore } from "@/persistence/eventStore";

import {
  initMatch,
  hydrateMatchState,
  getMatchState,
  reduceStateOnly,
  MatchState
} from "@/services/matchEngine";

/*
-------------------------------------------------------
MATCH REHYDRATION (ANCHOR OPTIMIZED)
-------------------------------------------------------
*/

export async function rehydrateMatch(matchId: string): Promise<void> {

  /*
  -------------------------------------------------------
  STEP 1 — Ensure match exists
  -------------------------------------------------------
  */

  initMatch(matchId);

  /*
  -------------------------------------------------------
  STEP 2 — Load latest snapshot
  -------------------------------------------------------
  */

  const snapshot = await eventStore.loadLatestSnapshot(matchId);

  let snapshotOver = -1;

  if (snapshot) {
    hydrateMatchState(matchId, snapshot);
    snapshotOver = snapshot.over;
  }

  /*
  -------------------------------------------------------
  STEP 3 — Load all events
  -------------------------------------------------------
  */

  const events = await eventStore.loadEvents(matchId);

  let state = getMatchState(matchId);

  if (!state) return;

  /*
  -------------------------------------------------------
  STEP 4 — Reset timeline
  -------------------------------------------------------
  */

  state.timelineIndex = [];

  /*
  -------------------------------------------------------
  STEP 5 — Partial deterministic rebuild
  -------------------------------------------------------
  */

  for (const event of events) {

    // Always restore timeline
    state.timelineIndex.push(event);

    // Skip invalid events
    if (!event.valid) continue;

    // Skip events already covered by snapshot
    if (snapshotOver >= 0 && event.over < snapshotOver) continue;

    state = reduceStateOnly(state, event);
  }

  /*
  -------------------------------------------------------
  STEP 6 — Final hydrate
  -------------------------------------------------------
  */

  hydrateMatchState(matchId, state);
}