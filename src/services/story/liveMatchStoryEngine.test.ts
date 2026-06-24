import { describe, it, expect } from "vitest";
import { getLiveMatchStory } from "./liveMatchStoryEngine";

describe("getLiveMatchStory", () => {
  it("returns empty string for unknown match", () => {
    const story = getLiveMatchStory("unknown-match-id");
    expect(story).toBe("");
  });

  it("returns empty string when no events exist", () => {
    const story = getLiveMatchStory("nonexistent");
    expect(story).toBe("");
  });
});
