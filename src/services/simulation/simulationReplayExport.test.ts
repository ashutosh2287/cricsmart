import { describe, it, expect, beforeEach } from "vitest";
import {
  appendReplayEvent,
  getReplayExport,
  clearReplayExport,
} from "./simulationReplayExport";

/* eslint-disable @typescript-eslint/no-explicit-any */

function makeBallEvent(overrides?: Record<string, any>): any {
  return {
    id: `evt-${Date.now()}-${Math.random()}`,
    slug: `ball-${Date.now()}`,
    over: 1,
    batsman: "Batter",
    nonStriker: "NonStriker",
    bowler: "Bowler",
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
    ...overrides,
  };
}

describe("simulationReplayExport", () => {
  beforeEach(() => {
    clearReplayExport("test-replay");
  });

  it("starts with empty export", () => {
    const result = getReplayExport("test-replay");
    expect(result.events).toEqual([]);
    expect(result.sourceType).toBe("SIMULATION");
  });

  it("appends events", () => {
    const event1 = makeBallEvent({ id: "evt-1" });
    const event2 = makeBallEvent({ id: "evt-2" });

    appendReplayEvent("test-replay", event1);
    appendReplayEvent("test-replay", event2);

    const result = getReplayExport("test-replay");
    expect(result.events).toHaveLength(2);
    expect(result.events[0].id).toBe("evt-1");
    expect(result.events[1].id).toBe("evt-2");
  });

  it("clears export", () => {
    appendReplayEvent("test-replay", makeBallEvent());
    clearReplayExport("test-replay");

    const result = getReplayExport("test-replay");
    expect(result.events).toEqual([]);
  });

  it("isolates by matchId", () => {
    appendReplayEvent("match-a", makeBallEvent({ id: "a1" }));
    appendReplayEvent("match-b", makeBallEvent({ id: "b1" }));

    expect(getReplayExport("match-a").events).toHaveLength(1);
    expect(getReplayExport("match-b").events).toHaveLength(1);

    clearReplayExport("match-a");
    expect(getReplayExport("match-a").events).toEqual([]);
    expect(getReplayExport("match-b").events).toHaveLength(1);
  });
});
