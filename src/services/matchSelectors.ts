import { useEffect, useState } from "react";
import { subscribeMatch, getMatchState, MatchState } from "./matchEngine";

/*
================================================
GENERIC SELECTOR HOOK
================================================
*/

export function useMatchSelector<T>(
  matchId: string,
  selector: (match: MatchState) => T
) {

  const [value, setValue] = useState(() => {

    const match = getMatchState(matchId);

    return match ? selector(match) : undefined;

  });

  useEffect(() => {

  const unsubscribe = subscribeMatch(matchId, () => {

    const match = getMatchState(matchId);

    if (!match) return;

    setValue(selector(match));

  });

  return () => {
    unsubscribe();
  };

}, [matchId, selector]);

  return value;
}

/*
================================================
SMALL FAST SELECTORS
================================================
*/

export function useMatchRuns(matchId:string){
  return useMatchSelector(matchId, m => m.runs);
}

export function useMatchWickets(matchId:string){
  return useMatchSelector(matchId, m => m.wickets);
}

export function useMatchOvers(matchId:string){
  return useMatchSelector(matchId, m => `${m.over}.${m.ball}`);
}