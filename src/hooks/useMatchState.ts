"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeMatch,
  getMatchState,
} from "@/lib/eventStore";

export function useMatchState(matchId: string) {
  return useSyncExternalStore(
    (callback) => subscribeMatch(matchId, callback),

    // ✅ LIVE REALTIME STATE
    () => getMatchState(matchId),

    // ✅ SSR FALLBACK
    () => getMatchState(matchId)
  );
}