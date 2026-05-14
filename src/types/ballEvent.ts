export type BallEventType =
  | "RUN"
  | "FOUR"
  | "SIX"
  | "WICKET"
  | "WD"
  | "NB"
  | "BYE"
  | "LB";

export type ExtraType = "WD" | "NB" | "BYE" | "LB";

export type EventSourceType =
  | "LIVE_INGESTION"
  | "MOCK_INGESTION"
  | "SIMULATION"
  | "REPLAY"
  | "MANUAL";

type BallEventBase = {
  id: string;
  slug: string;
  over: number;
  timestamp: number;
  valid: boolean;
  branchId?: string;
  commentary?: string;
  innings?: number;

  batsman: string;
  nonStriker: string;
  bowler: string;

  isLegalDelivery: boolean;
  totalRuns: number;
  replacedBy?: string;

  providerType?: string;
  providerTimestamp?: number;
  ingestionTimestamp?: number;
  eventSource?: EventSourceType;
  replaySourceId?: string;
};

export type RunBallEvent = BallEventBase & {
  type: "RUN";
  runs: number;
  wicket: false;
  extra: false;
  extraType?: never;
  extraRuns?: never;
};

export type FourBallEvent = BallEventBase & {
  type: "FOUR";
  runs: 4;
  wicket: false;
  extra: false;
  extraType?: never;
  extraRuns?: never;
};

export type SixBallEvent = BallEventBase & {
  type: "SIX";
  runs: 6;
  wicket: false;
  extra: false;
  extraType?: never;
  extraRuns?: never;
};

export type WicketBallEvent = BallEventBase & {
  type: "WICKET";
  runs: 0;
  wicket: true;
  extra: false;
  extraType?: never;
  extraRuns?: never;
  dismissedBatsman: string;
  dismissalKind?:
    | "BOWLED"
    | "CAUGHT"
    | "LBW"
    | "RUN_OUT"
    | "STUMPED"
    | "HIT_WICKET"
    | "UNKNOWN";
};

export type WideBallEvent = BallEventBase & {
  type: "WD";
  runs: number;
  wicket: false;
  extra: true;
  extraType: "WD";
  extraRuns: number;
};

export type NoBallEvent = BallEventBase & {
  type: "NB";
  runs: number;
  wicket: false;
  extra: true;
  extraType: "NB";
  extraRuns: number;
};

export type ByeBallEvent = BallEventBase & {
  type: "BYE";
  runs: number;
  wicket: false;
  extra: false;
  extraType: "BYE";
  extraRuns: number;
};

export type LegByeBallEvent = BallEventBase & {
  type: "LB";
  runs: number;
  wicket: false;
  extra: false;
  extraType: "LB";
  extraRuns: number;
};

export type BallEvent =
  | RunBallEvent
  | FourBallEvent
  | SixBallEvent
  | WicketBallEvent
  | WideBallEvent
  | NoBallEvent
  | ByeBallEvent
  | LegByeBallEvent;

export function isWicketEvent(event: BallEvent): event is WicketBallEvent {
  return event.type === "WICKET";
}

export function isExtraEvent(
  event: BallEvent
): event is WideBallEvent | NoBallEvent | ByeBallEvent | LegByeBallEvent {
  return (
    event.type === "WD" ||
    event.type === "NB" ||
    event.type === "BYE" ||
    event.type === "LB"
  );
}

export function isLegalDeliveryEvent(event: BallEvent): boolean {
  return event.isLegalDelivery;
}
