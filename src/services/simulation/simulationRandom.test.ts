import { describe, it, expect, afterEach } from "vitest";
import { setSimulationSeed, randomForMatch, clearSimulationSeed } from "./simulationRandom";

describe("simulationRandom", () => {
  afterEach(() => {
    clearSimulationSeed("test-match-1");
    clearSimulationSeed("test-match-2");
  });

  it("produces deterministic output with the same seed", () => {
    setSimulationSeed("test-match-1", "seed-abc");
    const r1a = randomForMatch("test-match-1");
    const r1b = randomForMatch("test-match-1");

    clearSimulationSeed("test-match-1");
    setSimulationSeed("test-match-1", "seed-abc");
    const r2a = randomForMatch("test-match-1");
    const r2b = randomForMatch("test-match-1");

    expect(r1a).toBe(r2a);
    expect(r1b).toBe(r2b);
  });

  it("produces different output with different seeds", () => {
    setSimulationSeed("test-match-1", "seed-abc");
    const r1 = randomForMatch("test-match-1");

    setSimulationSeed("test-match-2", "seed-xyz");
    const r2 = randomForMatch("test-match-2");

    expect(r1).not.toBe(r2);
  });

  it("falls back to Math.random when no seed is set", () => {
    const r = randomForMatch("nonexistent-match");
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(1);
  });

  it("returns values in [0, 1) range", () => {
    setSimulationSeed("test-match-1", "seed-1");
    for (let i = 0; i < 100; i++) {
      const r = randomForMatch("test-match-1");
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });
});
