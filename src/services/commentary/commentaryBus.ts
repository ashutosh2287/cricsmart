import type { CommentaryIntelligenceMetadata } from "./commentaryIntelligenceContract";

export type Commentary = {
  matchId: string;
  text: string;
  eventId: string;
  category: "BALL" | "INSIGHT" | "SUMMARY";
  metadata?: CommentaryIntelligenceMetadata;
};

type Listener = (c: Commentary) => void;

const listeners = new Set<Listener>();
const commentaryStore: Record<string, Commentary[]> = {};
const dedupeStore: Record<string, Set<string>> = {};

function dedupeKey(c: Commentary) {
  return `${c.eventId}:${c.category}:${c.text}`;
}

export function emitCommentary(c: Commentary) {
  if (!commentaryStore[c.matchId]) {
    commentaryStore[c.matchId] = [];
  }
  if (!dedupeStore[c.matchId]) {
    dedupeStore[c.matchId] = new Set();
  }

  const key = dedupeKey(c);
  if (dedupeStore[c.matchId].has(key)) {
    return;
  }

  dedupeStore[c.matchId].add(key);
  commentaryStore[c.matchId].push(c);

  listeners.forEach((cb) => cb(c));
}

export function subscribeCommentary(cb: Listener) {
  listeners.add(cb);

  return () => {
    listeners.delete(cb);
  };
}

export function getCommentary(matchId: string): Commentary[] {
  return commentaryStore[matchId] ?? [];
}
