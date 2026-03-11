import { BallEvent } from "@/types/ballEvent";

type PlayerFormState = {
  recentRuns: number[];
};

const formCache: Record<string, PlayerFormState> = {};

export function processPlayerFormEvent(
  matchId: string,
  event: BallEvent
) {

  if (!formCache[matchId]) {
    formCache[matchId] = { recentRuns: [] };
  }

  const state = formCache[matchId];

  state.recentRuns.push(event.runs ?? 0);

  if (state.recentRuns.length > 5) {
    state.recentRuns.shift();
  }

}

export function getPlayerForm(matchId: string) {

  const state = formCache[matchId];

  if (!state) return "NORMAL";

  const sum = state.recentRuns.reduce((a, b) => a + b, 0);

  if (sum >= 12) return "HOT";

  return "NORMAL";

}