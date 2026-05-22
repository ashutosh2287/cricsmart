import type { ReplayEvent } from "@/types/replayEvent";

export type WinProbabilityChartPoint = {
  over: number;
  batting: number;
  bowling: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
};

type WinProbabilityPayload = {
  homeWinPct: number;
  awayWinPct: number;
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
  if (!Array.isArray(events) || events.length === 0) return [];
  return events
    .map((e) => ({
      event: e,
      payload:
        (typeof e.payload === "object" && e.payload !== null
          ? (e.payload as Partial<WinProbabilityPayload>)
          : undefined) ?? (e as unknown as Partial<WinProbabilityPayload>),
    }))
    .filter(
      ({ event, payload }) =>
        event.type === "WIN_PROBABILITY" &&
        typeof payload.homeWinPct === "number" &&
        typeof payload.awayWinPct === "number"
    )
    .map(({ event, payload }) => {
      const over =
        typeof event.over === "number"
          ? event.over + (typeof event.ball === "number" ? event.ball / 10 : 0)
          : 0;
      return {
        over,
        batting: Math.max(0, Math.min(100, Number(payload.homeWinPct))),
        bowling: Math.max(0, Math.min(100, Number(payload.awayWinPct))),
      };
    });
}
