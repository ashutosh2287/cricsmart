import { useEffect, useRef, useState } from "react";
import { subscribeMatch, getMatchState, MatchState } from "./matchEngine";

/*
================================================
GENERIC SELECTOR HOOK (REACT SAFE)
================================================
*/

export function useMatchSelector<T>(
  matchId: string,
  selector: (match: MatchState) => T
) {

  const selectorRef = useRef(selector);

  // ✅ update ref AFTER render (React safe)
  useEffect(() => {
    selectorRef.current = selector;
  }, [selector]);

  const [value, setValue] = useState<T | undefined>(() => {

    const match = getMatchState(matchId);
    return match ? selector(match) : undefined;

  });

  useEffect(() => {

    const unsubscribe = subscribeMatch(matchId, () => {

      const match = getMatchState(matchId);
      if (!match) return;

      const newValue = selectorRef.current(match);

      setValue(prev => {
        if (Object.is(prev, newValue)) return prev;
        return newValue;
      });

    });

    return unsubscribe;

  }, [matchId]);

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