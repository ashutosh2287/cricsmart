import { getEventStream } from "../matchEngine";

export function generateMatchNarrative(matchId: string) {

  const events = getEventStream(matchId);

  if (!events.length) return "Match just started.";

  const last = events[events.length - 1];

  if (last.type === "WICKET") {
    return "Big breakthrough! The batting side loses a wicket.";
  }

  if (last.type === "FOUR" || last.type === "SIX") {
    return "Momentum shifting as boundaries flow.";
  }

  if (last.runs >= 3) {
    return "Pressure building with quick runs.";
  }

  return "Game progressing steadily.";
}