import type { ReplayEvent } from "@/hooks/useReplayEvents";

export type MomentumPoint = {
  over: number;
  score: number;
};

/**
 * Pure selector: derives per-ball momentum swings from BALL and WICKET
 * replay events.
 *
 * Input:  BALL / WICKET replay events
 * Output: [{ over, score }]  — score clamped to [-10, 10]
 */
export function getMomentumGraphData(events: ReplayEvent[]): MomentumPoint[] {
  const points: MomentumPoint[] = [];
  let momentum = 0;

  for (const event of events) {
    if (
      typeof event.type !== "string" ||
      event.type === "WIN_PROBABILITY" ||
      event.type === "MATCH_FINISHED"
    ) {
      continue;
    }

    const over = typeof event.over === "number" ? event.over : 0;
    const runs =
      typeof event.totalRuns === "number"
        ? event.totalRuns
        : typeof event.runs === "number"
          ? event.runs
          : 0;
    const wicketPenalty = event.type === "WICKET" ? 2.5 : 0;
    momentum = Math.max(
      -10,
      Math.min(10, momentum * 0.85 + runs * 0.8 - wicketPenalty)
    );

    points.push({ over, score: Number(momentum.toFixed(2)) });
  }

  return points;
}
