import { Match } from "../types/match";
import {
  MatchState,
  MatchEvent,
  nextMatchState,
} from "@/services/matchStateMachine";

// ✅ Match Metadata (Persistent)



type Listener = () => void;

type BallEventLike = {
  over?: number;
  ballInOver?: number;
};

type MatchWithRuntimeState = Match & {
  currentOver?: number;
  currentBall?: number;
  currentRuns?: number;
  currentWickets?: number;
};
type MatchMeta = {
  matchId: string;
  teamA: { id: string; name: string };
  teamB: { id: string; name: string };
};

const matchMetaStore: Record<string, MatchMeta> = {};

export const setMatchMeta = (meta: MatchMeta) => {
  matchMetaStore[meta.matchId] = meta;

  // ✅ ALSO UPDATE MATCH LIST
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

let matches: MatchWithRuntimeState[] = [];
let matchState: MatchState = "PRE_MATCH";
let listeners: Listener[] = [];

export const selectMatches = (): MatchWithRuntimeState[] => matches;

export const selectMatchState = (): MatchState => matchState;

export const selectMatchById = (matchId: string): MatchWithRuntimeState | null =>
  matches.find((match) => match.id === matchId) ?? null;

export const setMatches = (data: Match[]): void => {
  matches = data.map((match) => ({
    ...match,
    
  }));
  notify();
};

export const dispatchMatchEvent = (event: MatchEvent): void => {
  matchState = nextMatchState(matchState, event);
  notify();
};

export const dispatchBallEvent = (
  matchId: string,
  ballEvent: BallEventLike & {
    runs?: number;
    isWicket?: boolean;
  }
): void => {
  matches = matches.map((match) => {
    if (match.id !== matchId) return match;

    const newRuns = (match.currentRuns ?? 0) + (ballEvent.runs ?? 0);
    const newWickets =
      (match.currentWickets ?? 0) + (ballEvent.isWicket ? 1 : 0);

    return {
      ...match,
      currentOver: ballEvent.over ?? match.currentOver,
      currentBall: ballEvent.ballInOver ?? match.currentBall,
      currentRuns: newRuns,
      currentWickets: newWickets,
    };
  });

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

