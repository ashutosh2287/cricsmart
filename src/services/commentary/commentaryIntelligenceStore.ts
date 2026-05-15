import type { CommentaryIntelligenceResult } from "./commentaryIntelligenceContract";

type MatchIntelligenceState = {
  byEventId: Map<string, CommentaryIntelligenceResult>;
  latest: CommentaryIntelligenceResult | null;
};

const store = new Map<string, MatchIntelligenceState>();

function getState(matchId: string): MatchIntelligenceState {
  const existing = store.get(matchId);
  if (existing) return existing;

  const created: MatchIntelligenceState = {
    byEventId: new Map<string, CommentaryIntelligenceResult>(),
    latest: null,
  };
  store.set(matchId, created);
  return created;
}

export function persistCommentaryIntelligence(result: CommentaryIntelligenceResult) {
  const state = getState(result.matchId);
  state.byEventId.set(result.eventId, result);
  state.latest = result;
}

export function getLatestCommentaryIntelligence(matchId: string) {
  return store.get(matchId)?.latest ?? null;
}

export function getCommentaryIntelligenceByEvent(matchId: string, eventId: string) {
  return store.get(matchId)?.byEventId.get(eventId) ?? null;
}
