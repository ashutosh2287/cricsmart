import type { EventStore, MatchSnapshotRecord } from "./eventStore";
import { IndexedDbStore } from "./indexedDbStore";

import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";

class NoopEventStore implements EventStore {
  async appendEvent(_matchId: string, _event: BallEvent): Promise<void> {}

  async loadEvents(_matchId: string): Promise<BallEvent[]> {
    return [];
  }

  async saveSnapshot(
    _matchId: string,
    _innings: number,
    _over: number,
    _state: MatchState
  ): Promise<void> {}

  async loadLatestSnapshot(
    _matchId: string
  ): Promise<MatchSnapshotRecord | null> {
    return null;
  }
}

function createEventStore(): EventStore {
  if (typeof window === "undefined" || typeof indexedDB === "undefined") {
    return new NoopEventStore();
  }

  return new IndexedDbStore();
}

export const eventStore: EventStore = createEventStore();