import type { BallEvent, WicketBallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";
import type { CommentaryEvent } from "@/services/commentary/types/commentary.types";

export type MatchEventMeta = {
  eventId: string;
  sequence: number;
  timestamp: number;
  runtimeMatchId: string;
  innings: number;
  over: number;
  ball: number;
  eventType: string;
};

export type BallDomainEvent = {
  type: "BALL";
  runtimeMatchId: string;
  state: MatchState;
  ballEvent: BallEvent;
  eventMeta: MatchEventMeta;
  commentaryEvents: CommentaryEvent[];
};

export type WicketDomainEvent = {
  type: "WICKET";
  runtimeMatchId: string;
  state: MatchState;
  ballEvent: WicketBallEvent;
  eventMeta: MatchEventMeta;
};

export type MatchFinishedDomainEvent = {
  type: "MATCH_FINISHED";
  runtimeMatchId: string;
  state: MatchState;
  winner: string | null;
  winBy: string | null;
  timestamp: number;
};

export type DomainEvent =
  | BallDomainEvent
  | WicketDomainEvent
  | MatchFinishedDomainEvent;

export type DomainEventType = DomainEvent["type"];
export type DomainEventByType<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;
