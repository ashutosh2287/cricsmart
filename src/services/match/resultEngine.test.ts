import { describe, it, expect } from "vitest";
import { getMatchResult } from "./resultEngine";

describe("getMatchResult", () => {
  it("team batting first wins by runs when scoreA > scoreB", () => {
    const result = getMatchResult("India", "Australia", 180, 160, 6);
    expect(result.winner).toBe("India");
    expect(result.winBy).toBe("20 runs");
  });

  it("team batting second wins by wickets when scoreB > scoreA", () => {
    const result = getMatchResult("India", "Australia", 150, 155, 5);
    expect(result.winner).toBe("Australia");
    expect(result.winBy).toBe("5 wickets");
  });

  it("tie returns Match Draw when scores are equal", () => {
    const result = getMatchResult("India", "Australia", 170, 170, 3);
    expect(result.winner).toBe("Match Draw");
    expect(result.winBy).toBe("");
  });

  it("team wins by 1 run", () => {
    const result = getMatchResult("India", "Australia", 100, 99, 8);
    expect(result.winner).toBe("India");
    expect(result.winBy).toBe("1 runs");
  });

  it("team wins by 10 wickets", () => {
    const result = getMatchResult("India", "Australia", 100, 101, 10);
    expect(result.winner).toBe("Australia");
    expect(result.winBy).toBe("10 wickets");
  });

  it("handles 0 wickets left", () => {
    const result = getMatchResult("India", "Australia", 200, 201, 0);
    expect(result.winner).toBe("Australia");
    expect(result.winBy).toBe("0 wickets");
  });

  it("handles both scores being 0", () => {
    const result = getMatchResult("India", "Australia", 0, 0, 10);
    expect(result.winner).toBe("Match Draw");
  });
});
