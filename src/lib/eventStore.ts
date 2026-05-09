import type { MatchState } from "@/services/matchEngine";

const matchStateMap = new Map<string, MatchState>();
const listenersMap = new Map<string, Set<() => void>>();
const snapshotCache = new Map<string, MatchState>();

export function getMatchSnapshot(matchId: string): MatchState | null {
  return snapshotCache.get(matchId) ?? null;
}

export function getMatchState(matchId: string): MatchState | null {
  return matchStateMap.get(matchId) ?? null;
}

// 🔥 MAIN UPDATE FUNCTION
export function setMatchState(matchId: string, state: MatchState) {
  // ✅ ensure fresh immutable reference
  const newState = structuredClone(state);

  matchStateMap.set(matchId, newState);
  snapshotCache.set(matchId, newState);

  const listeners = listenersMap.get(matchId);

  if (!listeners) return;

  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.error("❌ Listener error", error);
    }
  });
}

// 🔥 OPTIONAL ALIAS
export function pushMatchState(
  matchId: string,
  state: MatchState
) {
  setMatchState(matchId, state);
}

export function subscribeMatch(
  matchId: string,
  callback: () => void
) {
  let listeners = listenersMap.get(matchId);

  if (!listeners) {
    listeners = new Set();
    listenersMap.set(matchId, listeners);
  }

  listeners.add(callback);

  return () => {
    const currentListeners = listenersMap.get(matchId);

    if (!currentListeners) return;

    currentListeners.delete(callback);

    if (currentListeners.size === 0) {
      listenersMap.delete(matchId);
    }
  };
}
