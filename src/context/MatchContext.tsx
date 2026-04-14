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
} from "@/persistence/eventStore/eventStore";

type MatchContextType = {
  matchId: string;
  state?: MatchState;
};

const MatchContext = createContext<MatchContextType | null>(null);

type MatchProviderProps = {
  children: React.ReactNode;
  value: {
    matchId: string;
    state?: MatchState;
  };
};

const emptySubscribe = () => () => {};
const getEmptySnapshot = () => undefined;

export function MatchProvider({ children, value }: MatchProviderProps) {
  const { matchId, state: fallbackState } = value;

const state = useSyncExternalStore(
    matchId ? (listener) => subscribeMatch(matchId, listener) : emptySubscribe,
    matchId
      ? () => getMatchSnapshot(matchId) ?? fallbackState
      : getEmptySnapshot,
    () => fallbackState
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