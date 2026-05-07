import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";

export type MatchSnapshotRecord = {
  matchId: string;
  innings: number;
  over: number;
  state: MatchState;
  createdAt: number;
};

export interface EventStore {
  appendEvent(
    matchId: string,
    event: BallEvent
  ): Promise<void>;

  loadEvents(matchId: string): Promise<BallEvent[]>;

  saveSnapshot(
    matchId: string,
    innings: number,
    over: number,
    state: MatchState
  ): Promise<void>;

  loadLatestSnapshot(
    matchId: string
  ): Promise<MatchSnapshotRecord | null>;
}