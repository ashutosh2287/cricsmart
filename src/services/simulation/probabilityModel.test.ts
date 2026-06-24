import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBallOutcome } from "./probabilityModel";
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

describe("getBallOutcome", () => {
  beforeEach(() => {
    setSimulationSeed("test-prob", "fixed-seed");
  });

  afterEach(() => {
    clearSimulationSeed("test-prob");
  });

  it("returns a valid outcome type", () => {
    const state = makeState();
    const outcome = getBallOutcome(state, "test-prob");
    expect(["RUN", "FOUR", "SIX", "WICKET", "WD", "NB", "BYE", "LB"]).toContain(outcome.type);
  });

  it("returns runs as a number", () => {
    const state = makeState();
    const outcome = getBallOutcome(state, "test-prob");
    expect(typeof outcome.runs).toBe("number");
    expect(outcome.runs).toBeGreaterThanOrEqual(0);
  });

  it("returns probability between 0 and 1", () => {
    const state = makeState();
    const outcome = getBallOutcome(state, "test-prob");
    expect(outcome.prob).toBeGreaterThan(0);
    expect(outcome.prob).toBeLessThanOrEqual(1);
  });

  it("can produce all outcome types over many iterations", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      clearSimulationSeed("test-prob");
      setSimulationSeed("test-prob", `seed-${i}`);
      const state = makeState();
      const outcome = getBallOutcome(state, "test-prob");
      seen.add(outcome.type);
    }
    expect(seen.has("RUN")).toBe(true);
    expect(seen.has("FOUR")).toBe(true);
    expect(seen.has("SIX")).toBe(true);
    expect(seen.has("WICKET")).toBe(true);
  });

  it("BYE outcomes have runs of 1 or 2", () => {
    let foundBye = false;
    for (let i = 0; i < 1000; i++) {
      clearSimulationSeed("test-prob");
      setSimulationSeed("test-prob", `bye-${i}`);
      const state = makeState();
      const outcome = getBallOutcome(state, "test-prob");
      if (outcome.type === "BYE") {
        foundBye = true;
        expect([1, 2]).toContain(outcome.runs);
      }
    }
    expect(foundBye).toBe(true);
  });

  it("LB outcomes have runs of 1 or 2", () => {
    let foundLB = false;
    for (let i = 0; i < 1000; i++) {
      clearSimulationSeed("test-prob");
      setSimulationSeed("test-prob", `lb-${i}`);
      const state = makeState();
      const outcome = getBallOutcome(state, "test-prob");
      if (outcome.type === "LB") {
        foundLB = true;
        expect([1, 2]).toContain(outcome.runs);
      }
    }
    expect(foundLB).toBe(true);
  });

  it("uses configOvers for pressure calculation", () => {
    const state = makeState({ target: 180, configOvers: 50 });
    const outcome = getBallOutcome(state, "test-prob");
    expect(outcome.prob).toBeGreaterThan(0);
  });
});
