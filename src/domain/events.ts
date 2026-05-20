import type { BallEvent, WicketBallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";

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

export type WinProbabilityDomainEvent = {
  type: "WIN_PROBABILITY";
  runtimeMatchId: string;
  homeWinPct: number;
  awayWinPct: number;
  innings: number;
  over: number;
  ball: number;
  timestamp: number;
};

export type CommentaryEvent = {
  type: "COMMENTARY";
  runtimeMatchId: string;
  commentaryId: string;
  over: number;
  ball: number;
  text: string;
  tone?: string;
  importance?: string;
  isBoundary?: boolean;
  isWicket?: boolean;
  timestamp: number;
};

export type DomainEvent =
  | BallDomainEvent
  | WicketDomainEvent
  | MatchFinishedDomainEvent
  | WinProbabilityDomainEvent
  | CommentaryEvent;

export type DomainEventType = DomainEvent["type"];
export type DomainEventByType<T extends DomainEventType> = Extract<DomainEvent, { type: T }>;
