import { getMatchState, getEventStream } from "../matchEngine";

const cache: Record<string, string> = {};

export function getLiveMatchStory(matchId: string): string {

  const state = getMatchState(matchId);
  const events = getEventStream(matchId);
  

  if (!state || !events.length) return "";
  if (cache[matchId]) return cache[matchId];

  const innings = state.innings[state.currentInningsIndex];
  if (!innings) return "";

  const runs = innings.runs;
  const wickets = innings.wickets;
  const over = innings.over;

  let line = "";

  if (wickets >= 7) {
    line = "The batting side is struggling with wickets falling rapidly.";
  } else if (over >= 15) {
    line = "We are in the death overs, every ball is crucial now.";
  } else if (runs > 100 && over < 12) {
    line = "Strong scoring rate, the batting side is dominating.";
  } else {
    line = "The match is finely balanced at this stage.";
  }
  

  cache[matchId] = line;

  return line;
  
}