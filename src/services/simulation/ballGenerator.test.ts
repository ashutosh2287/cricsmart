import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateBallEvent } from "./ballGenerator";
import { setSimulationSeed, clearSimulationSeed } from "./simulationRandom";
import type { SimulationState } from "./simulationState";

function makeState(overrides?: Partial<SimulationState>): SimulationState {
  return {
    over: 5,
    ball: 3,
    totalRuns: 45,
    wickets: 2,
    striker: "Virat Kohli",
    nonStriker: "Rohit Sharma",
    bowler: "Pat Cummins",
    battingOrder: ["Virat Kohli", "Rohit Sharma", "Shubman Gill"],
    nextBatsmanIndex: 2,
    bowlingOrder: ["Pat Cummins", "Mitchell Starc"],
    currentBowlerIndex: 0,
    teamA: { name: "India", short: "IND", squad: [] },
    teamB: { name: "Australia", short: "AUS", squad: [] },
    tossWinner: "India",
    decision: "BAT",
    currentInningsIndex: 0,
    phase: "MIDDLE",
    matchEnded: false,
    winner: null,
    winBy: null,
    battingTeam: { name: "India", short: "IND", squad: [] },
    bowlingTeam: { name: "Australia", short: "AUS", squad: [] },
    ...overrides,
  };
}

describe("generateBallEvent", () => {
  beforeEach(() => {
    setSimulationSeed("test-ball", "fixed-seed");
  });

  afterEach(() => {
    clearSimulationSeed("test-ball");
  });

  it("generates a valid BallEvent with required fields", () => {
    const state = makeState();
    const event = generateBallEvent(state, "test-ball");

    expect(event.id).toBeDefined();
    expect(event.slug).toBeDefined();
    expect(event.over).toBe(5);
    expect(event.batsman).toBe("Virat Kohli");
    expect(event.nonStriker).toBe("Rohit Sharma");
    expect(event.bowler).toBe("Pat Cummins");
    expect(event.timestamp).toBeGreaterThan(0);
    expect(event.innings).toBe(0);
    expect(event.eventSource).toBe("SIMULATION");
  });

  it("throws when striker is missing", () => {
    const state = makeState({ striker: "" });
    expect(() => generateBallEvent(state, "test-ball")).toThrow("incomplete player state");
  });

  it("throws when nonStriker is missing", () => {
    const state = makeState({ nonStriker: "" });
    expect(() => generateBallEvent(state, "test-ball")).toThrow("incomplete player state");
  });

  it("throws when bowler is missing", () => {
    const state = makeState({ bowler: "" });
    expect(() => generateBallEvent(state, "test-ball")).toThrow("incomplete player state");
  });

  it("throws when striker equals nonStriker", () => {
    const state = makeState({ striker: "Virat Kohli", nonStriker: "Virat Kohli" });
    expect(() => generateBallEvent(state, "test-ball")).toThrow("invalid batting pair");
  });

  it("generates different events over multiple calls", () => {
    const state = makeState();
    const events = new Set<string>();
    for (let i = 0; i < 50; i++) {
      clearSimulationSeed("test-ball");
      setSimulationSeed("test-ball", `ball-${i}`);
      const event = generateBallEvent(state, "test-ball");
      events.add(event.id);
    }
    expect(events.size).toBe(50);
  });

  it("wicket events have dismissalKind", () => {
    for (let i = 0; i < 500; i++) {
      clearSimulationSeed("test-ball");
      setSimulationSeed("test-ball", `wk-${i}`);
      const state = makeState();
      const event = generateBallEvent(state, "test-ball");
      if (event.type === "WICKET") {
        expect(event.dismissalKind).toBeDefined();
        expect(["BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED"]).toContain(event.dismissalKind);
        expect(event.dismissedBatsman).toBe("Virat Kohli");
        return;
      }
    }
  });
});
