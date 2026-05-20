import type { ReplayEvent } from "@/hooks/useReplayEvents";

export type WinProbabilityChartPoint = {
  over: number;
  batting: number;
  bowling: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
};

/**
 * Pure selector: extracts WIN_PROBABILITY replay events into chart-ready
 * batting/bowling percentage points.
 *
 * Input:  WIN_PROBABILITY replay events
 * Output: [{ over, batting, bowling }]
 */
export function getWinProbabilityData(
  events: ReplayEvent[]
): WinProbabilityChartPoint[] {
  return events
    .filter(
      (e) =>
        e.type === "WIN_PROBABILITY" &&
        typeof e.homeWinPct === "number" &&
        typeof e.awayWinPct === "number"
    )
    .map((e) => {
      const over =
        typeof e.over === "number"
          ? e.over + (typeof e.ball === "number" ? e.ball / 10 : 0)
          : 0;
      return {
        over,
        batting: Math.max(0, Math.min(100, Number(e.homeWinPct))),
        bowling: Math.max(0, Math.min(100, Number(e.awayWinPct))),
      };
    });
}
