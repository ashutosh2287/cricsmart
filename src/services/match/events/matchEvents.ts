import type { BallEvent } from "@/types/ballEvent";

export type MatchDomainEventType = "BALL" | "WICKET" | "MATCH_FINISHED";

export type MatchDomainEventMeta = {
  eventId: string;
  sequence?: number;
  timestamp: number;
  runtimeMatchId: string;
  innings?: number;
  over?: number;
  ball?: number;
  eventType?: string;
};

export type MatchDomainEvent =
  | {
      type: "BALL" | "WICKET";
      runtimeMatchId: string;
      timestamp: number;
      eventMeta: MatchDomainEventMeta;
      ballEvent: BallEvent;
    }
  | {
      type: "MATCH_FINISHED";
      runtimeMatchId: string;
      timestamp: number;
      winner: string | null;
      winBy: string | null;
    };
