import type { MatchState } from "@/services/matchEngine";

const matchStateMap = new Map<string, MatchState>();
const listenersMap = new Map<string, Set<() => void>>();

export function getMatchSnapshot(matchId: string): MatchState | null {
  return matchStateMap.get(matchId) ?? null;
}

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
  battingRecordsCount: currentInnings?.battingRecords?.length ?? 0,
  battingRecords: currentInnings?.battingRecords?.map((b) => ({
    name: b?.name,
    runs: b?.runs,
    balls: b?.balls,
    isOut: b?.isOut,
  })) ?? [],
});

  const listeners = listenersMap.get(matchId);
  if (!listeners || listeners.size === 0) return;

  [...listeners].forEach((listener) => {
    listener();
  });
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