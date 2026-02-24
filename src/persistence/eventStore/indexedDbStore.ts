import { db, StoredEvent, StoredSnapshot, StoredBranchRegistry } from "./dbSchema";
import { EventStore } from "./eventStore";

import { BallEvent } from "@/types/ballEvent";
import { MatchState, BranchRegistry } from "@/services/matchEngine";

/*
-------------------------------------------------------
INDEXED DB EVENT STORE IMPLEMENTATION
-------------------------------------------------------

RULES:

- append-only event log
- never mutate events
- snapshots = performance cache
- branch registry stored separately
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

    // remove matchId before returning
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

  /*
  -------------------------------------------------------
  SAVE BRANCH REGISTRY
  -------------------------------------------------------
  */

  async saveBranchRegistry(
    matchId: string,
    registry: BranchRegistry
  ): Promise<void> {

    const record: StoredBranchRegistry = {
      matchId,
      registry
    };

    await db.branches.put(record);
  }

  /*
  -------------------------------------------------------
  LOAD BRANCH REGISTRY
  -------------------------------------------------------
  */

  async loadBranchRegistry(matchId: string): Promise<BranchRegistry | null> {

    const result = await db.branches.get(matchId);

    return result?.registry ?? null;
  }
}