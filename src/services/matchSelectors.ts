"use client";

import { useSyncExternalStore } from "react";
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
  });
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