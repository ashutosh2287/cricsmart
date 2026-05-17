import test from "node:test";
import assert from "node:assert/strict";
import { buildStartSimulationPayload } from "@/services/simulation/startSimulationClient";

test("buildStartSimulationPayload returns payload with required fields", () => {
  const payload = buildStartSimulationPayload("match-1", {
    teamA: { name: "India" },
    teamB: { name: "England" },
    toss: { winner: "India", decision: "BAT" },
  });

  assert.deepEqual(payload, {
    matchId: "match-1",
    teamAName: "India",
    teamBName: "England",
    tossWinner: "India",
    tossDecision: "BAT",
  });
});

test("buildStartSimulationPayload throws when toss is missing", () => {
  assert.throws(
    () =>
      buildStartSimulationPayload("match-1", {
        teamA: { name: "India" },
        teamB: { name: "England" },
      }),
    { message: "Please complete toss first." }
  );
});
