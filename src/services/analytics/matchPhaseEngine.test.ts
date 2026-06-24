import { describe, it, expect } from "vitest";
import type { MatchPhase } from "./matchPhaseEngine";

describe("MatchPhase type", () => {
  it("includes all expected phases", () => {
    const phases: MatchPhase[] = [
      "POWERPLAY_ASSAULT",
      "POWERPLAY_CONTROL",
      "MIDDLE_OVERS_BUILD",
      "BOWLING_DOMINANCE",
      "DEATH_OVERS_ATTACK",
      "DEATH_OVERS_PRESSURE",
      "COLLAPSE_PHASE",
    ];
    expect(phases).toHaveLength(7);
  });
});
