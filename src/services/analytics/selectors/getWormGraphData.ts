import type { ReplayEvent } from "@/types/replayEvent";
import type { BallEvent } from "@/types/ballEvent";

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
    const payload =
      (typeof event.payload === "object" && event.payload !== null
        ? (event.payload as Partial<BallEvent>)
        : undefined) ?? (event as unknown as Partial<BallEvent>);

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
      typeof payload.totalRuns === "number"
        ? payload.totalRuns
        : typeof payload.runs === "number"
          ? payload.runs
          : 0;

    score += runs;
    points.push({ over: event.over, score });
  }

  return points;
}
