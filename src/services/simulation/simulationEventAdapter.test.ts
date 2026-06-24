import { describe, it, expect } from "vitest";
import { toEngineEvent } from "./simulationEventAdapter";

/* eslint-disable @typescript-eslint/no-explicit-any */

type StrictBallEvent = {
  id: string;
  slug: string;
  over: number;
  batsman: string;
  nonStriker: string;
  bowler: string;
  timestamp: number;
  valid: boolean;
  innings: number;
  providerType: string;
  providerTimestamp: number;
  ingestionTimestamp: number;
  eventSource: "SIMULATION";
  type: string;
  runs?: number;
  totalRuns?: number;
  wicket?: boolean;
  extra?: boolean;
  extraType?: string;
  extraRuns?: number;
  isLegalDelivery?: boolean;
  dismissedBatsman?: string;
  dismissalKind?: string;
  battingTeam: string;
  bowlingTeam: string;
};

function makeBallEvent(overrides?: Partial<StrictBallEvent>): StrictBallEvent {
  return {
    id: "evt-1",
    slug: "ball-1-0-1234",
    over: 1,
    batsman: "Kohli",
    nonStriker: "Rohit",
    bowler: "Starc",
    timestamp: Date.now(),
    valid: true,
    innings: 0,
    providerType: "simulation",
    providerTimestamp: Date.now(),
    ingestionTimestamp: Date.now(),
    eventSource: "SIMULATION",
    type: "RUN",
    runs: 1,
    totalRuns: 1,
    wicket: false,
    extra: false,
    isLegalDelivery: true,
    battingTeam: "India",
    bowlingTeam: "Australia",
    ...overrides,
  };
}

describe("toEngineEvent", () => {
  it("converts a RUN ball event to engine event", () => {
    const ball = makeBallEvent({ type: "RUN", runs: 2, totalRuns: 2 });
    const engineEvent = toEngineEvent(ball as any) as any;

    expect(engineEvent.type).toBe("RUN");
    expect(engineEvent.runs).toBe(2);
    expect(engineEvent.batsman).toBe("Kohli");
    expect(engineEvent.nonStriker).toBe("Rohit");
    expect(engineEvent.bowler).toBe("Starc");
    expect(engineEvent.battingTeam).toBe("India");
    expect(engineEvent.bowlingTeam).toBe("Australia");
  });

  it("converts a WICKET ball event", () => {
    const ball = makeBallEvent({
      type: "WICKET",
      runs: 0,
      totalRuns: 0,
      wicket: true,
      dismissedBatsman: "Kohli",
      dismissalKind: "CAUGHT",
    });
    const engineEvent = toEngineEvent(ball as any);
    expect(engineEvent.type).toBe("WICKET");
  });

  it("converts a FOUR ball event", () => {
    const ball = makeBallEvent({ type: "FOUR", runs: 4, totalRuns: 4 });
    const engineEvent = toEngineEvent(ball as any);
    expect(engineEvent.type).toBe("FOUR");
  });

  it("converts a SIX ball event", () => {
    const ball = makeBallEvent({ type: "SIX", runs: 6, totalRuns: 6 });
    const engineEvent = toEngineEvent(ball as any);
    expect(engineEvent.type).toBe("SIX");
  });

  it("converts a WD ball event", () => {
    const ball = makeBallEvent({ type: "WD", runs: 1, totalRuns: 1, extra: true, extraType: "WD", extraRuns: 1 });
    const engineEvent = toEngineEvent(ball as any);
    expect(engineEvent.type).toBe("WD");
  });

  it("converts a BYE ball event", () => {
    const ball = makeBallEvent({ type: "BYE", runs: 2, totalRuns: 2, extraType: "BYE", extraRuns: 2 });
    const engineEvent = toEngineEvent(ball as any);
    expect(engineEvent.type).toBe("BYE");
  });

  it("converts a LB ball event", () => {
    const ball = makeBallEvent({ type: "LB", runs: 1, totalRuns: 1, extraType: "LB", extraRuns: 1 });
    const engineEvent = toEngineEvent(ball as any);
    expect(engineEvent.type).toBe("LB");
  });

  it("throws when battingTeam is missing", () => {
    const ball = makeBallEvent({ battingTeam: "" });
    expect(() => toEngineEvent(ball as any)).toThrow("Missing team info");
  });

  it("throws when bowlingTeam is missing", () => {
    const ball = makeBallEvent({ bowlingTeam: "" });
    expect(() => toEngineEvent(ball as any)).toThrow("Missing team info");
  });
});
