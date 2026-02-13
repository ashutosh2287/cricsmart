import { Match } from "../types/match";

import {
  MatchState,
  MatchEvent,
  nextMatchState
} from "@/services/matchStateMachine";


type Listener = (matches: Match[], matchState: MatchState) => void;


// ------------------
// STORE DATA
// ------------------

let matches: Match[] = [];
let matchState: MatchState = "PRE_MATCH";

let listeners: Listener[] = [];


// ------------------
// SET MATCHES
// ------------------

export const setMatches = (data: Match[]) => {

  matches = data;

  notify();
};


// ------------------
// STATE MACHINE DISPATCH
// ------------------

export const dispatchMatchEvent = (event: MatchEvent) => {

  const next = nextMatchState(matchState, event);

  matchState = next;

  notify();
};


// ------------------
// GETTERS
// ------------------

export const getStoreMatches = () => matches;

export const getMatchState = () => matchState;


// ------------------
// SUBSCRIBE
// ------------------

export const subscribeStore = (listener: Listener) => {

  listeners.push(listener);

  // initial call
  listener(matches, matchState);

  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
};


// ------------------
// INTERNAL NOTIFY
// ------------------

const notify = () => {
  listeners.forEach(l => l(matches, matchState));
};
