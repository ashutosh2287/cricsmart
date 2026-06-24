import { getMatchState, getEventStream } from "../matchEngine";

export function getLiveMatchStory(matchId: string): string {

  const state = getMatchState(matchId);
  const events = getEventStream(matchId);

  if (!state || !events.length) return "";

  const innings = state.innings[state.currentInningsIndex];
  if (!innings) return "";

  const runs = innings.runs;
  const wickets = innings.wickets;
  const over = innings.over;

  if (wickets >= 7) {
    return "The batting side is struggling with wickets falling rapidly.";
  } else if (over >= 15) {
    return "We are in the death overs, every ball is crucial now.";
  } else if (runs > 100 && over < 12) {
    return "Strong scoring rate, the batting side is dominating.";
  }

  return "The match is finely balanced at this stage.";
}