import { useEffect, useRef, useState } from "react";
import { subscribeMatch, getMatchState, MatchState } from "./matchEngine";
import { getMatches } from "@/store/realtimeStore";

/*
================================================
GENERIC ENGINE SELECTOR (Selective subscription)
================================================
*/

export function useMatchSelector<T>(
  matchId: string,
  selector: (match: MatchState) => T
) {

  const selectorRef = useRef(selector);

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
FAST ENGINE SELECTORS
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
/*
================================================
OVERS DISPLAY SELECTOR (Derived value)
================================================
*/

export function useMatchOversDisplay(matchId: string) {

  return useMatchSelector(matchId, m => {

    // internal engine uses zero-based over
    const displayOver = m.over + 1;

    return `${displayOver}.${m.ball}`;

  });

}

/*
================================================
MATCH METADATA SELECTOR (Selective metadata)
================================================
*/

export function useMatchMeta(slug: string) {

  const [match, setMatch] = useState(() =>
    getMatches().find(m => m.slug === slug)
  );

  useEffect(() => {

    // lightweight metadata refresh
    const interval = setInterval(() => {

      const updated = getMatches().find(m => m.slug === slug);

      setMatch(prev => {
        if (prev === updated) return prev;
        return updated;
      });

    }, 1000);

    return () => clearInterval(interval);

  }, [slug]);

  return match;
}

export function useMatchRunRate(matchId: string) {

  return useMatchSelector(matchId, m => {

    const totalOvers = m.over + m.ball / 6;

    return totalOvers > 0
      ? (m.runs / totalOvers).toFixed(2)
      : "0.00";

  });

}