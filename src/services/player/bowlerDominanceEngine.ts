import { BallEvent } from "@/types/ballEvent";

type BowlerState = {
  recentRuns: number[];
  wickets: number;
};

const bowlerCache: Record<string, BowlerState> = {};

export function processBowlerEvent(
  matchId: string,
  event: BallEvent
) {

  if (!bowlerCache[matchId]) {

    bowlerCache[matchId] = {
      recentRuns: [],
      wickets: 0
    };

  }

  const state = bowlerCache[matchId];

  state.recentRuns.push(event.runs ?? 0);

  if (event.wicket) {
    state.wickets++;
  }

  if (state.recentRuns.length > 6) {
    state.recentRuns.shift();
  }

}

export function isBowlerDominating(matchId: string) {

  const state = bowlerCache[matchId];

  if (!state) return false;

  const runs = state.recentRuns.reduce((a,b)=>a+b,0);

  return runs <= 3 && state.wickets >= 1;

}