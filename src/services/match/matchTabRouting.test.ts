import { describe, it, expect } from "vitest";
import { resolveRequestedTab } from "@/services/match/matchTabRouting";

describe("resolveRequestedTab", () => {
  it("defaults to overview when tab is missing", () => {
    expect(resolveRequestedTab(null)).toBe("overview");
  });

  it("maps timeline to overs", () => {
    expect(resolveRequestedTab("timeline")).toBe("overs");
  });

  it("keeps explicit admin tab", () => {
    expect(resolveRequestedTab("admin")).toBe("admin");
  });
});
