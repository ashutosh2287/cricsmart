import type { ReplayEvent } from "@/types/replayEvent";

export type WormPoint = {
  over: number;
  score: number;
};

/**
 * Pure selector: builds a cumulative worm score progression from BALL
 * replay events.
 *
 * Input:  BALL replay events (must have `over` and `totalRuns` or `runs`)
 * Output: [{ over, score }]  — score is cumulative runs up to that ball
 */
export function getWormGraphData(events: ReplayEvent[]): WormPoint[] {
  if (!Array.isArray(events) || events.length === 0) return [];
  let score = 0;
  const points: WormPoint[] = [];

  for (const event of events) {
    if (
      typeof event.type !== "string" ||
      event.type === "WIN_PROBABILITY" ||
      event.type === "MATCH_FINISHED" ||
      event.type === "WICKET"
    ) {
      continue;
    }
    if (typeof event.over !== "number") continue;

    const runs =
      typeof event.totalRuns === "number"
        ? event.totalRuns
        : typeof event.runs === "number"
          ? event.runs
          : 0;

    score += runs;
    points.push({ over: event.over, score });
  }

  return points;
}
