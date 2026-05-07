"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeMatch,
  getMatchSnapshot,
} from "@/lib/eventStore";

export function useMatchState(matchId: string) {
  return useSyncExternalStore(
    (callback) => subscribeMatch(matchId, callback),
    () => getMatchSnapshot(matchId),
    () => getMatchSnapshot(matchId)
  );
}