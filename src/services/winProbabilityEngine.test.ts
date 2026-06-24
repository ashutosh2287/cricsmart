import { describe, it, expect } from "vitest";
import { computeWinProbability } from "./winProbabilityEngine";
import type { MatchState } from "./matchEngine";

function makeState(overrides?: Partial<MatchState>): MatchState {
  return {
    matchId: "wp-test",
    format: "T20",
    configOvers: 20,
    innings: [
      { runs: 100, wickets: 3, over: 10, ball: 0, overs: {}, completed: false, battingTeam: "India", bowlingTeam: "Australia", battingRecords: [], bowlingStats: {}, striker: "", nonStriker: "", currentBowler: "", lastDismissedBatsman: "", nextBatsmanIndex: 2, battingOrder: [] },
      { runs: 0, wickets: 0, over: 0, ball: 0, overs: {}, completed: false, battingTeam: "Australia", bowlingTeam: "India", battingRecords: [], bowlingStats: {}, striker: "", nonStriker: "", currentBowler: "", lastDismissedBatsman: "", nextBatsmanIndex: 2, battingOrder: [] },
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
    ...overrides,
  };
}

describe("computeWinProbability", () => {
  it("returns probability object in first innings", () => {
    const result = computeWinProbability(makeState());
    expect(result).toBeDefined();
    expect(result?.battingWinProbability).toBeGreaterThan(0);
    expect(result?.battingWinProbability).toBeLessThanOrEqual(100);
    expect(result?.bowlingWinProbability).toBeGreaterThan(0);
    expect(result?.bowlingWinProbability).toBeLessThanOrEqual(100);
  });

  it("returns 50/50 when match hasn't started", () => {
    const state = makeState({
      innings: [
        { runs: 0, wickets: 0, over: 0, ball: 0, overs: {}, completed: false, battingTeam: "", bowlingTeam: "", battingRecords: [], bowlingStats: {}, striker: "", nonStriker: "", currentBowler: "", lastDismissedBatsman: "", nextBatsmanIndex: 2, battingOrder: [] },
        { runs: 0, wickets: 0, over: 0, ball: 0, overs: {}, completed: false, battingTeam: "", bowlingTeam: "", battingRecords: [], bowlingStats: {}, striker: "", nonStriker: "", currentBowler: "", lastDismissedBatsman: "", nextBatsmanIndex: 2, battingOrder: [] },
      ],
    });
    const result = computeWinProbability(state);
    expect(result).toBeDefined();
    expect(result?.battingWinProbability).toBe(50);
  });
});
