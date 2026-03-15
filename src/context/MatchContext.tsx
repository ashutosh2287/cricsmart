"use client";

import { createContext, useContext } from "react";
import { MatchState } from "@/services/matchEngine";

type MatchContextType = {
  matchId: string;
  state?: MatchState;
};

const MatchContext = createContext<MatchContextType | null>(null);

export function MatchProvider({
  children,
  value
}: {
  children: React.ReactNode;
  value: MatchContextType;
}) {
  return (
    <MatchContext.Provider value={value}>
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