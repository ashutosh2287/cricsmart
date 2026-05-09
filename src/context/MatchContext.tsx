"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import type { MatchState } from "@/services/matchEngine";
import {
  getMatchSnapshot,
  subscribeMatch,
} from "@/lib/eventStore";

type MatchContextType = {
  matchId: string;
  state?: MatchState | null;
};

const MatchContext = createContext<MatchContextType | null>(null);

type MatchProviderProps = {
  children: React.ReactNode;
  matchId: string;
};

const emptySubscribe = () => () => {};

export function MatchProvider({
  children,
  matchId,
}: MatchProviderProps) {

  const getSnapshot = () => {
    if (!matchId) return undefined;

    return getMatchSnapshot(matchId);
  };

  const state = useSyncExternalStore(
    matchId
      ? (listener) => subscribeMatch(matchId, listener)
      : emptySubscribe,

    getSnapshot,
    getSnapshot
  );

  const contextValue = useMemo<MatchContextType>(
    () => ({
      matchId,
      state,
    }),
    [matchId, state]
  );

  console.log("🟢 MATCH PROVIDER UPDATE", {
  runs: state?.innings?.[
    state?.currentInningsIndex ?? 0
  ]?.runs,

  wickets: state?.innings?.[
    state?.currentInningsIndex ?? 0
  ]?.wickets,

});

  return (
    <MatchContext.Provider value={contextValue}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatch() {
  const ctx = useContext(MatchContext);

  if (!ctx) {
    throw new Error("useMatch must be used inside MatchProvider");
  }

  return ctx;
}