import type { MatchState } from "@/services/matchEngine";

// 🔥 In-memory store
const matchStateMap = new Map<string, MatchState>();

// 🔥 listeners per match
const listenersMap = new Map<string, Set<() => void>>();

// =============================
// ✅ GET SNAPSHOT
// =============================
export function getMatchSnapshot(matchId: string): MatchState | null {
  return matchStateMap.get(matchId) ?? null;
}

// =============================
// ✅ SET STATE (IMPORTANT)
// =============================
export function setMatchState(matchId: string, state: MatchState) {
  // ⚠️ MUST create new reference
  matchStateMap.set(matchId, { ...state });

  // 🔥 notify all listeners
  const listeners = listenersMap.get(matchId);
  if (listeners) {
    listeners.forEach((listener) => listener());
  }
}

// =============================
// ✅ SUBSCRIBE (React will use this)
// =============================
export function subscribeMatch(
  matchId: string,
  callback: () => void
) {
  if (!listenersMap.has(matchId)) {
    listenersMap.set(matchId, new Set());
  }

  const listeners = listenersMap.get(matchId)!;
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}