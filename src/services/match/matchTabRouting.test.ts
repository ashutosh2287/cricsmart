import test from "node:test";
import assert from "node:assert/strict";
import { resolveRequestedTab } from "@/services/match/matchTabRouting";

test("resolveRequestedTab defaults to overview when tab is missing", () => {
  assert.equal(resolveRequestedTab(null), "overview");
});

test("resolveRequestedTab maps timeline to overs", () => {
  assert.equal(resolveRequestedTab("timeline"), "overs");
});

test("resolveRequestedTab keeps explicit admin tab", () => {
  assert.equal(resolveRequestedTab("admin"), "admin");
});
