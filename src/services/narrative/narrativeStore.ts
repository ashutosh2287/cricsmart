import { NarrativeState } from "./narrativeTypes";

const store: Record<string, Record<string, NarrativeState>> = {};

export function getNarrativeState(matchId: string, branchId: string) {
  return store[matchId]?.[branchId] ?? null;
}

export function setNarrativeState(
  matchId: string,
  branchId: string,
  state: NarrativeState
) {
  if (!store[matchId]) store[matchId] = {};
  store[matchId][branchId] = state;
}

export function resetNarrative(matchId: string, branchId: string) {
  if (!store[matchId]) store[matchId] = {};
  store[matchId][branchId] = {
    matchId,
    branchId,
    currentArc: "NORMAL",
    pressureScore: 0,
    momentumScore: 0
  };
}