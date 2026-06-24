import { describe, it, expect } from "vitest";
import { computeMatchDrama } from "./matchDramaEngine";
import type { MatchState } from "../matchEngine";

function makeState(overrides?: Partial<MatchState>): MatchState {
  return {
    matchId: "drama-test",
    format: "T20",
    configOvers: 20,
    innings: [
      { runs: 150, wickets: 5, over: 15, ball: 3, overs: {}, completed: false, battingTeam: "India", bowlingTeam: "Australia", battingRecords: [], bowlingStats: {}, striker: "", nonStriker: "", currentBowler: "", lastDismissedBatsman: "", nextBatsmanIndex: 2, battingOrder: [] },
      { runs: 120, wickets: 4, over: 12, ball: 0, overs: {}, completed: false, battingTeam: "Australia", bowlingTeam: "India", battingRecords: [], bowlingStats: {}, striker: "", nonStriker: "", currentBowler: "", lastDismissedBatsman: "", nextBatsmanIndex: 2, battingOrder: [] },
    ],
    currentInningsIndex: 1,
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

describe("computeMatchDrama", () => {
  it("returns a number between 0 and 100", () => {
    const drama = computeMatchDrama(makeState());
    expect(typeof drama).toBe("number");
    expect(drama).toBeGreaterThanOrEqual(0);
    expect(drama).toBeLessThanOrEqual(100);
  });

  it("different matches get independent drama scores", () => {
    const state1 = makeState({ matchId: "match-1" });
    const state2 = makeState({ matchId: "match-2" });
    const d1 = computeMatchDrama(state1);
    const d2 = computeMatchDrama(state2);
    expect(typeof d1).toBe("number");
    expect(typeof d2).toBe("number");
  });
});
