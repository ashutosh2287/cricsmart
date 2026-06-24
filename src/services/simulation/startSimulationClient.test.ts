import { describe, it, expect } from "vitest";
import { buildStartSimulationPayload } from "@/services/simulation/startSimulationClient";

describe("buildStartSimulationPayload", () => {
  it("returns payload with required fields", () => {
    const payload = buildStartSimulationPayload("match-1", {
      teamA: { name: "India" },
      teamB: { name: "England" },
      toss: { winner: "India", decision: "BAT" },
    });

    expect(payload).toEqual({
      matchId: "match-1",
      teamAName: "India",
      teamBName: "England",
      tossWinner: "India",
      tossDecision: "BAT",
    });
  });

  it("throws when toss is missing", () => {
    expect(() =>
      buildStartSimulationPayload("match-1", {
        teamA: { name: "India" },
        teamB: { name: "England" },
      })
    ).toThrow("Please complete toss first.");
  });
});
