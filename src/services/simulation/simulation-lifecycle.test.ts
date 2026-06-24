import { describe, it, expect } from "vitest";
import {
  SIMULATION_LIFECYCLE_STATES,
  normalizeSimulationLifecycleState,
  isSimulationLifecycleAtLeast,
} from "./simulation-lifecycle";

describe("simulation-lifecycle", () => {
  it("has 7 lifecycle states in correct order", () => {
    expect(SIMULATION_LIFECYCLE_STATES).toEqual([
      "DRAFT",
      "CONFIGURING",
      "READY",
      "INITIALIZING",
      "RUNNING",
      "PAUSED",
      "COMPLETED",
    ]);
  });

  describe("normalizeSimulationLifecycleState", () => {
    it("returns DRAFT for unknown state", () => {
      expect(normalizeSimulationLifecycleState("UNKNOWN")).toBe("DRAFT");
    });

    it("returns the same state for valid states", () => {
      for (const state of SIMULATION_LIFECYCLE_STATES) {
        expect(normalizeSimulationLifecycleState(state)).toBe(state);
      }
    });
  });

  describe("isSimulationLifecycleAtLeast", () => {
    it("RUNNING is at least CONFIGURING", () => {
      expect(isSimulationLifecycleAtLeast("RUNNING", "CONFIGURING")).toBe(true);
    });

    it("DRAFT is not at least RUNNING", () => {
      expect(isSimulationLifecycleAtLeast("DRAFT", "RUNNING")).toBe(false);
    });

    it("same state returns true", () => {
      expect(isSimulationLifecycleAtLeast("RUNNING", "RUNNING")).toBe(true);
    });

    it("COMPLETED is at least everything", () => {
      for (const state of SIMULATION_LIFECYCLE_STATES) {
        expect(isSimulationLifecycleAtLeast("COMPLETED", state)).toBe(true);
      }
    });

    it("DRAFT is only at least DRAFT", () => {
      for (const state of SIMULATION_LIFECYCLE_STATES) {
        const result = isSimulationLifecycleAtLeast("DRAFT", state);
        expect(result).toBe(state === "DRAFT");
      }
    });
  });
});
