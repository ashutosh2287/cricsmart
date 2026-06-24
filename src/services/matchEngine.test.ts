import { describe, it, expect, beforeEach } from "vitest";
import {
  initMatch,
  getMatchState,
  resetMatchState,
  reduceStateOnly,
  hydrateMatchState,
} from "./matchEngine";
import type { MatchState } from "./matchEngine";
import type { BallEvent } from "@/types/ballEvent";

/* eslint-disable @typescript-eslint/no-explicit-any */

function makeBallEvent(overrides?: Record<string, any>): any {
  return {
    id: `evt-${Date.now()}-${Math.random()}`,
    slug: `ball-${Date.now()}`,
    over: 0,
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

function createTestState(): MatchState {
  return {
    matchId: "test-match",
    format: "T20",
    configOvers: 20,
    innings: [
      {
        runs: 0, wickets: 0, over: 0, ball: 0, overs: {},
        battingTeam: "India", bowlingTeam: "Australia", completed: false,
        striker: "", nonStriker: "", lastDismissedBatsman: "", currentBowler: "",
        bowlingStats: {}, battingRecords: [], nextBatsmanIndex: 2, battingOrder: [],
      },
      {
        runs: 0, wickets: 0, over: 0, ball: 0, overs: {},
        battingTeam: "Australia", bowlingTeam: "India", completed: false,
        striker: "", nonStriker: "", lastDismissedBatsman: "", currentBowler: "",
        bowlingStats: {}, battingRecords: [], nextBatsmanIndex: 2, battingOrder: [],
      },
    ],
    currentInningsIndex: 0,
    activeBranchId: "main",
    branches: ["main"],
    teamA: { name: "India", squad: [] },
    teamB: { name: "Australia", squad: [] },
    tossWinner: "India",
    decision: "BAT",
    matchEnded: false,
    winner: null,
    winBy: null,
  };
}

describe("matchEngine", () => {
  beforeEach(() => {
    resetMatchState("test-match");
  });

  describe("initMatch + getMatchState", () => {
    it("creates initial match state accessible via getMatchState", () => {
      initMatch("test-match");
      const state = getMatchState("test-match");
      expect(state).toBeDefined();
      expect(state?.matchId).toBe("test-match");
      expect(state?.innings).toHaveLength(2);
      expect(state?.currentInningsIndex).toBe(0);
      expect(state?.matchEnded).toBe(false);
      expect(state?.winner).toBeNull();
    });

    it("initializes innings with empty overs", () => {
      initMatch("test-match");
      const state = getMatchState("test-match")!;
      expect(state.innings[0].runs).toBe(0);
      expect(state.innings[0].wickets).toBe(0);
      expect(state.innings[0].over).toBe(0);
      expect(state.innings[0].ball).toBe(0);
      expect(state.innings[0].completed).toBe(false);
    });

    it("does not re-init existing match", () => {
      initMatch("test-match");
      const state1 = getMatchState("test-match");
      initMatch("test-match");
      const state2 = getMatchState("test-match");
      expect(state1?.matchId).toBe(state2?.matchId);
    });
  });

  describe("getMatchState", () => {
    it("returns undefined for unknown match", () => {
      const state = getMatchState("unknown-match");
      expect(state).toBeUndefined();
    });
  });

  describe("reduceStateOnly (pure reducer)", () => {
    it("adds runs for RUN event", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "RUN", runs: 2, totalRuns: 2 });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].runs).toBe(2);
    });

    it("adds 4 runs for FOUR event", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "FOUR", runs: 4, totalRuns: 4 });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].runs).toBe(4);
    });

    it("adds 6 runs for SIX event", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "SIX", runs: 6, totalRuns: 6 });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].runs).toBe(6);
    });

    it("increments wickets for WICKET event", () => {
      const state = createTestState();
      state.innings[0].battingOrder = ["Kohli", "Rohit", "Gill"];
      state.innings[0].striker = "Kohli";
      state.innings[0].nonStriker = "Rohit";
      state.innings[0].nextBatsmanIndex = 2;
      const event = makeBallEvent({
        type: "WICKET",
        runs: 0,
        totalRuns: 0,
        wicket: true,
        dismissedBatsman: "Kohli",
      });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].wickets).toBe(1);
    });

    it("advances ball count for legal delivery", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "RUN", runs: 1, isLegalDelivery: true });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].ball).toBe(1);
    });

    it("does not advance ball for wide", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "WD", runs: 1, isLegalDelivery: false, extra: true, extraType: "WD", extraRuns: 1 });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].ball).toBe(0);
      expect(newState.innings[0].runs).toBe(1);
    });

    it("does not advance ball for no ball", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "NB", runs: 1, isLegalDelivery: false, extra: true, extraType: "NB", extraRuns: 1 });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].ball).toBe(0);
      expect(newState.innings[0].runs).toBe(1);
    });

    it("adds bye runs", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "BYE", runs: 2, totalRuns: 2, extraType: "BYE", extraRuns: 2 });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].runs).toBe(2);
    });

    it("adds leg bye runs", () => {
      const state = createTestState();
      const event = makeBallEvent({ type: "LB", runs: 1, totalRuns: 1, extraType: "LB", extraRuns: 1 });
      const newState = reduceStateOnly(state, event);
      expect(newState.innings[0].runs).toBe(1);
    });

    it("accumulates runs over multiple events", () => {
      let state = createTestState();
      state = reduceStateOnly(state, makeBallEvent({ type: "RUN", runs: 1 }));
      state = reduceStateOnly(state, makeBallEvent({ type: "FOUR", runs: 4 }));
      state = reduceStateOnly(state, makeBallEvent({ type: "RUN", runs: 2 }));
      expect(state.innings[0].runs).toBe(7);
      expect(state.innings[0].ball).toBe(3);
    });

    it("does not mutate original state", () => {
      const state = createTestState();
      const originalInnings = JSON.parse(JSON.stringify(state.innings));
      reduceStateOnly(state, makeBallEvent({ type: "RUN", runs: 5 }));
      expect(state.innings[0].runs).toBe(0);
      expect(JSON.stringify(state.innings)).toBe(JSON.stringify(originalInnings));
    });
  });

  describe("hydrateMatchState", () => {
    it("hydrates a match state", () => {
      const testState = createTestState();
      hydrateMatchState("test-match", testState);
      const state = getMatchState("test-match");
      expect(state).toBeDefined();
      expect(state?.matchId).toBe("test-match");
      expect(state?.teamA.name).toBe("India");
    });
  });
});
