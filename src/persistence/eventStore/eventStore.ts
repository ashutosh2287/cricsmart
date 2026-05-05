import type { MatchState } from "@/services/matchEngine";

const matchStateMap = new Map<string, MatchState>();
const listenersMap = new Map<string, Set<() => void>>();

export function getMatchSnapshot(matchId: string): MatchState | null {
  return matchStateMap.get(matchId) ?? null;
}

// 🔥 MAIN UPDATE FUNCTION
export function setMatchState(matchId: string, state: MatchState) {
  matchStateMap.set(matchId, state);

  const currentInnings = state.innings[state.currentInningsIndex];

  console.log("🔥 STATE UPDATED", {
    matchId,
    innings0Runs: state.innings[0]?.runs ?? 0,
    innings1Runs: state.innings[1]?.runs ?? 0,
    currentInningsIndex: state.currentInningsIndex,
    striker: currentInnings?.striker ?? "",
    nonStriker: currentInnings?.nonStriker ?? "",
  });

  const listeners = listenersMap.get(matchId);
  if (!listeners || listeners.size === 0) return;

  listeners.forEach((listener) => listener());
}

// 🔥 OPTIONAL ALIAS (clean usage)
export function pushMatchState(matchId: string, state: MatchState) {
  setMatchState(matchId, state);
}

export function subscribeMatch(matchId: string, callback: () => void) {
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