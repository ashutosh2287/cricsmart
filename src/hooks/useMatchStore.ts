import { useSyncExternalStore } from "react";
import {
  selectMatchById,
  selectMatches,
  selectMatchState,
  subscribeStore,
} from "../store/matchStore";

export function useMatches() {
  return useSyncExternalStore(subscribeStore, selectMatches);
}

export function useMatchState() {
  return useSyncExternalStore(subscribeStore, selectMatchState);
}

export function useMatch(matchId: string) {
  return useSyncExternalStore(
    subscribeStore,
    () => selectMatchById(matchId),
    () => selectMatchById(matchId)
  );
}