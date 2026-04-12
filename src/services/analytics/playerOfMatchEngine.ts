import { getEventStream } from "../matchEngine";

export function getPlayerOfMatch(matchId: string): string {

  const events = getEventStream(matchId);

  const scores: Record<string, number> = {};

  for (const e of events) {

    if (e.batsman) {
      scores[e.batsman] =
        (scores[e.batsman] || 0) + (e.runs ?? 0);
    }

    if (e.bowler && e.wicket) {
      scores[e.bowler] =
        (scores[e.bowler] || 0) + 25; // wicket weight
    }
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  return sorted[0]?.[0] || "Unknown";
}