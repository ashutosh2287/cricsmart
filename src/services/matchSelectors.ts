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

    return () => {
  unsubscribe();
};

  }, [matchId]);

  return value;
}

/*
================================================
FAST ENGINE SELECTORS (Multi-Innings Safe)
================================================
*/

export function useMatchRuns(matchId: string) {
  return useMatchSelector(matchId, m => {
    const innings = m.innings[m.currentInningsIndex];
    return innings?.runs ?? 0;
  });
}

export function useMatchWickets(matchId: string) {
  return useMatchSelector(matchId, m => {
    const innings = m.innings[m.currentInningsIndex];
    return innings?.wickets ?? 0;
  });
}

export function useMatchOvers(matchId: string) {
  return useMatchSelector(matchId, m => {
    const innings = m.innings[m.currentInningsIndex];
    return innings ? `${innings.over}.${innings.ball}` : "0.0";
  });
}

/*
================================================
OVERS DISPLAY SELECTOR (Derived value)
================================================
*/

export function useMatchOversDisplay(matchId: string) {
  return useMatchSelector(matchId, m => {
    const innings = m.innings[m.currentInningsIndex];
    if (!innings) return "0.0";

    const displayOver = innings.over + 1;
    return `${displayOver}.${innings.ball}`;
  });
}

/*
================================================
MATCH RUN RATE (Multi-Innings Safe)
================================================
*/

export function useMatchRunRate(matchId: string) {
  return useMatchSelector(matchId, m => {
    const innings = m.innings[m.currentInningsIndex];
    if (!innings) return "0.00";

    const totalOvers = innings.over + innings.ball / 6;

    return totalOvers > 0
      ? (innings.runs / totalOvers).toFixed(2)
      : "0.00";
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

