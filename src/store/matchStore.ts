import { Match } from "../types/match";
import {
  MatchState,
  MatchEvent,
  nextMatchState,
} from "@/services/matchStateMachine";
import type { MatchMetadata } from "@/types/matchMetadata";

type Listener = () => void;

export type MatchWithRuntimeState = Match & {
  currentOver?: number;
  currentBall?: number;
  currentRuns?: number;
  currentWickets?: number;
};

export type MatchMeta = MatchMetadata;

const matchMetaStore: Record<string, MatchMeta> = {};

let matches: MatchWithRuntimeState[] = [];
let matchState: MatchState = "PRE_MATCH";
let listeners: Listener[] = [];

export const setMatchMeta = (meta: MatchMeta) => {
  matchMetaStore[meta.matchId] = meta;

  matches = matches.map((m) =>
    m.id === meta.matchId
      ? {
          ...m,
          team1: meta.teamA.name,
          team2: meta.teamB.name,
        }
      : m
  );

  notify();
};

export const getMatchMeta = (matchId?: string) => {
  if (!matchId) return null;
  return matchMetaStore[matchId] ?? null;
};

export const selectMatches = (): MatchWithRuntimeState[] => matches;

export const selectMatchState = (): MatchState => matchState;

export const selectMatchById = (
  matchId: string
): MatchWithRuntimeState | null =>
  matches.find((match) => match.id === matchId) ?? null;

export const setMatches = (data: Match[]): void => {
  matches = data.map((match) => ({
    ...match,
  }));
  notify();
};

export const upsertMatch = (updatedMatch: MatchWithRuntimeState): void => {
  const index = matches.findIndex((match) => match.id === updatedMatch.id);

  if (index === -1) {
    matches = [...matches, updatedMatch];
  } else {
    matches = matches.map((match, i) =>
      i === index ? { ...match, ...updatedMatch } : match
    );
  }

  notify();
};

export const patchMatchRuntime = (
  matchId: string,
  runtime: Partial<
    Pick<
      MatchWithRuntimeState,
      "currentOver" | "currentBall" | "currentRuns" | "currentWickets"
    >
  >
): void => {
  matches = matches.map((match) =>
    match.id === matchId
      ? {
          ...match,
          ...runtime,
        }
      : match
  );

  notify();
};

export const dispatchMatchEvent = (event: MatchEvent): void => {
  matchState = nextMatchState(matchState, event);
  notify();
};

export const getStoreMatches = (): MatchWithRuntimeState[] => matches;

export const getMatchState = (): MatchState => matchState;

export const subscribeStore = (listener: Listener): (() => void) => {
  listeners.push(listener);

  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
};

const notify = (): void => {
  listeners.forEach((listener) => listener());
};
