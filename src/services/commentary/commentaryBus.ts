export type Commentary = {
  matchId: string;
  text: string;
  eventId: string;
  category: "BALL" | "INSIGHT";
};

type Listener = (c: Commentary) => void;

const listeners = new Set<Listener>();
const commentaryStore: Record<string, Commentary[]> = {};



// ✅ EMIT COMMENTARY (THIS WAS MISSING)
export function emitCommentary(c: Commentary) {

  // ✅ store permanently
  if (!commentaryStore[c.matchId]) {
    commentaryStore[c.matchId] = [];
  }

  const exists = commentaryStore[c.matchId]?.some(
  (item) => item.eventId === c.eventId
);

if (!exists) {
  commentaryStore[c.matchId].push(c);
}

  // existing listeners
  listeners.forEach(cb => cb(c));
}

export function subscribeCommentary(cb: Listener) {
  listeners.add(cb);

  return () => {
    listeners.delete(cb); // ✅ now returns void
  };
}
export function getCommentary(matchId: string): Commentary[] {
  return commentaryStore[matchId] ?? [];
}