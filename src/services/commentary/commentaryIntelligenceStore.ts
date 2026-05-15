import type { CommentaryIntelligenceResult } from "./commentaryIntelligenceContract";

type MatchIntelligenceState = {
  byEventId: Record<string, CommentaryIntelligenceResult>;
  latest: CommentaryIntelligenceResult | null;
};

const store: Record<string, MatchIntelligenceState> = {};

function getState(matchId: string): MatchIntelligenceState {
  if (!store[matchId]) {
    store[matchId] = {
      byEventId: {},
      latest: null,
    };
  }
  return store[matchId];
}

export function persistCommentaryIntelligence(result: CommentaryIntelligenceResult) {
  const state = getState(result.matchId);
  state.byEventId[result.eventId] = result;
  state.latest = result;
}

export function getLatestCommentaryIntelligence(matchId: string) {
  return store[matchId]?.latest ?? null;
}

export function getCommentaryIntelligenceByEvent(matchId: string, eventId: string) {
  return store[matchId]?.byEventId[eventId] ?? null;
}
