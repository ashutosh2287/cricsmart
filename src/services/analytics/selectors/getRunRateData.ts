import type { ReplayEvent } from "@/types/replayEvent";
import type { BallEvent } from "@/types/ballEvent";

export type RunRatePoint = {
  over: number;
  runRate: number;
};

/**
 * Pure selector: computes cumulative run-rate after each ball from BALL
 * replay events.
 *
 * Input:  BALL replay events
 * Output: [{ over, runRate }]  — runRate = (totalRuns * 6) / legalBalls
 */
export function getRunRateData(events: ReplayEvent[]): RunRatePoint[] {
  if (!Array.isArray(events) || events.length === 0) return [];
  let totalRuns = 0;
  let legalBalls = 0;
  const points: RunRatePoint[] = [];

  for (const event of events) {
    const payload =
      (typeof event.payload === "object" && event.payload !== null
        ? (event.payload as Partial<BallEvent>)
        : undefined) ?? (event as unknown as Partial<BallEvent>);

    if (
      typeof event.type !== "string" ||
      event.type === "WIN_PROBABILITY" ||
      event.type === "MATCH_FINISHED"
    ) {
      continue;
    }

    const runs =
      typeof payload.totalRuns === "number"
        ? payload.totalRuns
        : typeof payload.runs === "number"
          ? payload.runs
          : 0;

    totalRuns += runs;
    if (payload.isLegalDelivery !== false) {
      legalBalls += 1;
    }

    const over = legalBalls / 6;
    points.push({
      over,
      runRate: legalBalls > 0 ? Number(((totalRuns * 6) / legalBalls).toFixed(2)) : 0,
    });
  }

  return points;
}