import { useSyncExternalStore } from "react";
import type { MatchState } from "./matchEngine";
import {
  getMatchSnapshot,
  subscribeMatch as subscribeEventMatch,
} from "@/persistence/eventStore/eventStore";
import { getStoreMatches, subscribeStore } from "@/store/realtimeStore";

function getFallbackMatchState(matchId: string): MatchState | undefined {
  const snapshot = getMatchSnapshot(matchId);
  return snapshot ?? undefined;
}

export function useMatchSelector<T>(
  matchId: string,
  selector: (match: MatchState) => T
) {
  return useSyncExternalStore(
    matchId
      ? (listener) => subscribeEventMatch(matchId, listener)
      : () => () => {},
    () => {
      const match = getFallbackMatchState(matchId);
      return match ? selector(match) : undefined;
    },
    () => {
      const match = getFallbackMatchState(matchId);
      return match ? selector(match) : undefined;
    }
  );
}

export function useMatchRuns(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    return innings?.runs ?? 0;
  });
}

export function useMatchWickets(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    return innings?.wickets ?? 0;
  });
}

export function useMatchOvers(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    return innings ? `${innings.over}.${innings.ball}` : "0.0";
  });
}

export function useMatchOversDisplay(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    if (!innings) return "0.0";
    return `${innings.over}.${innings.ball}`;
  });
}

export function useMatchRunRate(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    if (!innings) return "0.00";

    const totalOvers = innings.over + innings.ball / 6;

    return totalOvers > 0
      ? (innings.runs / totalOvers).toFixed(2)
      : "0.00";
  });
}

export function useMatchMeta(slug: string) {
  return useSyncExternalStore(
    subscribeStore,
    () => getStoreMatches().find((m) => m.slug === slug),
    () => getStoreMatches().find((m) => m.slug === slug)
  );
}