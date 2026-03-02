import { BallEvent } from "@/types/ballEvent";
import { MatchState } from "@/services/matchEngine";

export interface EventStore {

  appendEvent(matchId: string, event: BallEvent): Promise<void>;

  loadEvents(matchId: string): Promise<BallEvent[]>;

  saveSnapshot(matchId: string, over: number, state: MatchState): Promise<void>;

  loadLatestSnapshot(matchId: string): Promise<MatchState | null>;

  
}