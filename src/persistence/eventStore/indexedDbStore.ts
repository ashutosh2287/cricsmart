import { db, StoredEvent, StoredSnapshot } from "./dbSchema";
import { EventStore } from "./eventStore";

import { BallEvent } from "@/types/ballEvent";
import { MatchState } from "@/services/matchEngine";

/*
-------------------------------------------------------
INDEXED DB EVENT STORE IMPLEMENTATION
-------------------------------------------------------

RULES:

- append-only canonical event log
- never mutate events
- snapshots = performance cache
- branch registry is NOT persisted (runtime metadata)
*/

export class IndexedDbStore implements EventStore {

  /*
  -------------------------------------------------------
  APPEND EVENT (CANONICAL WRITE)
  -------------------------------------------------------
  */

  async appendEvent(matchId: string, event: BallEvent): Promise<void> {

    const stored: StoredEvent = {
      matchId,
      ...event
    };

    await db.events.add(stored);
  }

  /*
  -------------------------------------------------------
  LOAD FULL TIMELINE
  -------------------------------------------------------
  */

  async loadEvents(matchId: string): Promise<BallEvent[]> {

    const rows = await db.events
      .where("matchId")
      .equals(matchId)
      .sortBy("timestamp");

    return rows.map(({ matchId: _, ...event }) => event);
  }

  /*
  -------------------------------------------------------
  SAVE SNAPSHOT
  -------------------------------------------------------
  */

  async saveSnapshot(
    matchId: string,
    over: number,
    state: MatchState
  ): Promise<void> {

    const snap: StoredSnapshot = {
      matchId,
      over,
      state
    };

    await db.snapshots.add(snap);
  }

  /*
  -------------------------------------------------------
  LOAD LATEST SNAPSHOT
  -------------------------------------------------------
  */

  async loadLatestSnapshot(matchId: string): Promise<MatchState | null> {

    const snaps = await db.snapshots
      .where("matchId")
      .equals(matchId)
      .reverse()
      .sortBy("over");

    if (!snaps.length) return null;

    return snaps[0].state;
  }
}