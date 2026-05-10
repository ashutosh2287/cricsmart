"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";
import type { MatchState } from "./matchEngine";
import {
  getMatchSnapshot,
  subscribeMatch as subscribeEventMatch,
}  from "@/lib/eventStore";
import { getStoreMatches, subscribeStore } from "@/store/matchStore";

/*
====================================================
BASE SNAPSHOT
====================================================
*/

function getFallbackMatchState(matchId: string): MatchState | undefined {
  const snapshot = getMatchSnapshot(matchId);
  return snapshot ?? undefined;
}

/*
====================================================
GENERIC SELECTOR
====================================================
*/

export type EqualityFn<T> = (prev: T, next: T) => boolean;

export function shallowEqual<T>(prev: T, next: T): boolean {
  if (Object.is(prev, next)) return true;

  if (
    typeof prev !== "object" ||
    prev === null ||
    typeof next !== "object" ||
    next === null
  ) {
    return false;
  }

  const prevObj = prev as Record<string, unknown>;
  const nextObj = next as Record<string, unknown>;

  const prevKeys = Object.keys(prevObj);
  const nextKeys = Object.keys(nextObj);
  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of prevKeys) {
    if (!Object.prototype.hasOwnProperty.call(nextObj, key)) return false;
    if (!Object.is(prevObj[key], nextObj[key])) return false;
  }

  return true;
}

export function useMatchSelector<T>(
  matchId: string,
  selector: (match: MatchState) => T,
  equalityFn?: EqualityFn<T | undefined>
) {
  return useSyncExternalStoreWithSelector(
    matchId
      ? (listener) => subscribeEventMatch(matchId, listener)
      : () => () => {},
    () => getFallbackMatchState(matchId),
    () => getFallbackMatchState(matchId),
    (match) => (match ? selector(match) : undefined),
    equalityFn ?? Object.is
  );
}

/*
====================================================
BASIC STATS
====================================================
*/

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

/*
====================================================
🔥 NEW: BATSMEN
====================================================
*/

export function useStriker(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    return innings?.striker ?? "";
  });
}

export function useNonStriker(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    return innings?.nonStriker ?? "";
  });
}

/*
====================================================
🔥 NEW: LAST BALL EVENT
====================================================
*/

export function useLastEvent(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    if (!innings) return null;

    const overs = innings.overs || {};
    const overKeys = Object.keys(overs);

    if (overKeys.length === 0) return null;

    const lastOver = overs[Number(overKeys[overKeys.length - 1])];
    if (!lastOver || lastOver.length === 0) return null;

    return lastOver[lastOver.length - 1];
  });
}

/*
====================================================
🔥 NEW: COMMENTARY
====================================================
*/

export function useCommentary(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    // commentary is injected into state via broadcast
    // fallback safe
    return m.commentary ?? [];
  }, shallowEqual);
}

export function useScore(matchId: string) {
  const runs = useMatchRuns(matchId);
  const wickets = useMatchWickets(matchId);
  const overs = useMatchOversDisplay(matchId);

  return useMemo(
    () => ({
      runs: runs ?? 0,
      wickets: wickets ?? 0,
      overs: overs ?? "0.0",
    }),
    [overs, runs, wickets]
  );
}

export function useCurrentInnings(matchId: string) {
  return useMatchSelector(matchId, (m) => m.innings[m.currentInningsIndex]);
}

export function useCurrentInningsOvers(matchId: string) {
  return useMatchSelector(matchId, (m) => {
    const innings = m.innings[m.currentInningsIndex];
    return innings?.overs ?? {};
  }, shallowEqual);
}

export function useCurrentBatters(matchId: string) {
  return useMatchSelector(
    matchId,
    (m) => {
      const innings = m.innings[m.currentInningsIndex];
      return {
        striker: innings?.striker ?? "",
        nonStriker: innings?.nonStriker ?? "",
      };
    },
    shallowEqual
  );
}

export function useMomentum(matchId: string) {
  return useMatchSelector(
    matchId,
    (m) => {
      const innings = m.innings[m.currentInningsIndex];
      const over = innings?.over ?? 0;
      const ball = innings?.ball ?? 0;
      const runs = innings?.runs ?? 0;
      const wickets = innings?.wickets ?? 0;
      return { over, ball, runs, wickets };
    },
    shallowEqual
  );
}

export function useWinProbability(matchId: string) {
  return useMatchSelector(
    matchId,
    (m) => {
      const innings = m.innings[m.currentInningsIndex];
      const over = innings?.over ?? 0;
      const ball = innings?.ball ?? 0;
      const wickets = innings?.wickets ?? 0;
      const inningsIndex = m.currentInningsIndex;
      return { inningsIndex, over, ball, wickets };
    },
    shallowEqual
  );
}

/*
====================================================
MATCH META (UNCHANGED)
====================================================
*/

export function useMatchMeta(slug: string) {
  return useSyncExternalStore(
    subscribeStore,
    () => getStoreMatches().find((m) => m.slug === slug),
    () => getStoreMatches().find((m) => m.slug === slug)
  );
}
