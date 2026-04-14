import { getDb, StoredEvent, StoredSnapshot } from "./dbSchema";
import type { EventStore, MatchSnapshotRecord } from "./eventStore";
import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";

function assertBrowserIndexedDbAvailable() {
  if (typeof window === "undefined") {
    throw new Error(
      "IndexedDbStore can only run in the browser. Use a server-safe EventStore on the server."
    );
  }

  if (typeof indexedDB === "undefined") {
    throw new Error(
      "IndexedDB is not available in this environment. Use a browser-only persistence path."
    );
  }
}

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export class IndexedDbStore implements EventStore {
  constructor() {
    assertBrowserIndexedDbAvailable();
  }

  async appendEvent(matchId: string, event: BallEvent): Promise<void> {
    const db = getDb();

    const stored: StoredEvent = {
      matchId,
      ...cloneState(event),
    };

    await db.events.put(stored);
  }

  async loadEvents(matchId: string): Promise<BallEvent[]> {
    const db = getDb();

    const rows = await db.events
      .where("matchId")
      .equals(matchId)
      .sortBy("timestamp");

    return rows.map((row: StoredEvent) => {
      const event = { ...row };
      delete (event as { matchId?: string }).matchId;
      return cloneState(event as BallEvent);
    });
  }

  async saveSnapshot(
    matchId: string,
    innings: number,
    over: number,
    state: MatchState
  ): Promise<void> {
    const db = getDb();

    const snap: StoredSnapshot = {
      matchId,
      innings,
      over,
      state: cloneState(state),
      createdAt: Date.now(),
    };

    await db.snapshots.put(snap);
  }

  async loadLatestSnapshot(matchId: string): Promise<MatchSnapshotRecord | null> {
    const db = getDb();

    const snaps = await db.snapshots
      .where("matchId")
      .equals(matchId)
      .toArray();

    if (!snaps.length) return null;

    const latest = snaps.sort((a, b) => {
      if (b.innings !== a.innings) {
        return b.innings - a.innings;
      }
      if (b.over !== a.over) {
        return b.over - a.over;
      }
      return b.createdAt - a.createdAt;
    })[0];

    return {
      matchId: latest.matchId,
      innings: latest.innings,
      over: latest.over,
      state: cloneState(latest.state),
      createdAt: latest.createdAt,
    };
  }
}