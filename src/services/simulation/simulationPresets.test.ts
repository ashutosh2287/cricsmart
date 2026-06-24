import { describe, it, expect } from "vitest";
import { simulationPresets, getSimulationPreset } from "./simulationPresets";

describe("simulationPresets", () => {
  it("has 5 presets", () => {
    expect(simulationPresets).toHaveLength(5);
  });

  it("each preset has required fields", () => {
    for (const preset of simulationPresets) {
      expect(preset.key).toBeDefined();
      expect(typeof preset.key).toBe("string");
      expect(preset.teamAName).toBeDefined();
      expect(preset.teamBName).toBeDefined();
      expect(preset.tossWinner).toBeDefined();
      expect(["BAT", "BOWL"]).toContain(preset.tossDecision);
      expect(preset.startSpeedMs).toBeGreaterThan(0);
    }
  });

  describe("getSimulationPreset", () => {
    it("returns preset for valid key", () => {
      const preset = getSimulationPreset("last-over-thriller");
      expect(preset).toBeDefined();
      expect(preset?.key).toBe("last-over-thriller");
    });

    it("returns null for invalid key", () => {
      expect(getSimulationPreset("nonexistent")).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(getSimulationPreset(undefined)).toBeNull();
    });
  });
});
