import type { MatchState } from "@/services/matchEngine";

const matchStateMap = new Map<string, MatchState>();
const listenersMap = new Map<string, Set<() => void>>();
const snapshotCache = new Map<string, MatchState>();

export function getMatchSnapshot(matchId: string): MatchState | null {
  const snapshot = snapshotCache.get(matchId) ?? null;

  console.log("📡 SNAPSHOT READ", {
    matchId,
    runs: snapshot?.innings?.[snapshot.currentInningsIndex]?.runs ?? 0,
    wickets:
      snapshot?.innings?.[snapshot.currentInningsIndex]?.wickets ?? 0,
    over:
      snapshot?.innings?.[snapshot.currentInningsIndex]?.over ?? 0,
    ball:
      snapshot?.innings?.[snapshot.currentInningsIndex]?.ball ?? 0,
  });

  return snapshot;
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

  const currentInnings =
    newState.innings[newState.currentInningsIndex];

  console.log("🔥 STATE UPDATED", {
    matchId,
    innings0Runs: newState.innings[0]?.runs ?? 0,
    innings1Runs: newState.innings[1]?.runs ?? 0,
    currentInningsIndex: newState.currentInningsIndex,

    striker: currentInnings?.striker ?? "",
    nonStriker: currentInnings?.nonStriker ?? "",

    runs: currentInnings?.runs ?? 0,
    wickets: currentInnings?.wickets ?? 0,
    over: currentInnings?.over ?? 0,
    ball: currentInnings?.ball ?? 0,
  });

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