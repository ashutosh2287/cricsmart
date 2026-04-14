import { Match } from "../types/match";
import {
  MatchState,
  MatchEvent,
  nextMatchState,
} from "@/services/matchStateMachine";

type Listener = () => void;

type BallEventLike = {
  over?: number;
  ballInOver?: number;
};

type MatchWithRuntimeState = Match & {
  currentOver?: number;
  currentBall?: number;
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
    currentOver: undefined,
    currentBall: undefined,
  }));
  notify();
};

export const dispatchMatchEvent = (event: MatchEvent): void => {
  matchState = nextMatchState(matchState, event);
  notify();
};

export const dispatchBallEvent = (
  matchId: string,
  ballEvent: BallEventLike
): void => {
  matches = matches.map((match) =>
    match.id === matchId
      ? {
          ...match,
          currentOver: ballEvent.over ?? match.currentOver,
          currentBall: ballEvent.ballInOver ?? match.currentBall,
        }
      : match
  );

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