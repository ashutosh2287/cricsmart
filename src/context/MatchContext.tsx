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
