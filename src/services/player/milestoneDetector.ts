import { BallEvent } from "@/types/ballEvent";

const batterRuns: Record<string, number> = {};

export function processMilestoneEvent(
  matchId: string,
  event: BallEvent
) {

  if (!batterRuns[matchId]) {
    batterRuns[matchId] = 0;
  }

  batterRuns[matchId] += event.runs ?? 0;

}

export function getMilestone(matchId: string) {

  const runs = batterRuns[matchId] ?? 0;

  if (runs >= 100) return "CENTURY";

  if (runs >= 50) return "FIFTY";

  return null;

}