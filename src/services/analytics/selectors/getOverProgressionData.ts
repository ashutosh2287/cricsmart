import type { ReplayEvent } from "@/hooks/useReplayEvents";

type ProgressionPoint = {
  label: string;
  batting: number | null;
  bowling: number | null;
};

export type OverProgressionData = {
  overs: ProgressionPoint[];
  runRate: ProgressionPoint[];
  worm: ProgressionPoint[];
};

/**
 * Pure selector: builds over-by-over progression data split by innings from
 * BALL replay events.
 *
 * Innings 0 populates the `batting` series; innings 1+ populate `bowling`.
 *
 * Input:  BALL replay events (must have `totalRuns` to be counted)
 * Output: { overs, runRate, worm } — each is [{ label, batting, bowling }]
 */
export function getOverProgressionData(
  events: ReplayEvent[]
): OverProgressionData {
  // Only count events that originate from a BallEvent (they always have totalRuns)
  const ballEvents = events.filter(
    (e) =>
      typeof e.totalRuns === "number" &&
      typeof e.type === "string" &&
      e.type !== "WIN_PROBABILITY" &&
      e.type !== "MATCH_FINISHED"
  );

  // Group runs and legal-ball counts by innings → over
  const inningsMap = new Map<
    number,
    Map<number, { runs: number; legalBalls: number }>
  >();

  for (const event of ballEvents) {
    const inningsIndex =
      typeof event.innings === "number" ? event.innings : 0;
    const overNumber =
      typeof event.over === "number" ? Math.floor(event.over) : 0;
    const runs = typeof event.totalRuns === "number" ? event.totalRuns : 0;
    const isLegal = event.isLegalDelivery !== false;

    if (!inningsMap.has(inningsIndex)) {
      inningsMap.set(inningsIndex, new Map());
    }
    const oversMap = inningsMap.get(inningsIndex)!;
    if (!oversMap.has(overNumber)) {
      oversMap.set(overNumber, { runs: 0, legalBalls: 0 });
    }
    const overData = oversMap.get(overNumber)!;
    overData.runs += runs;
    if (isLegal) overData.legalBalls += 1;
  }

  const overs: ProgressionPoint[] = [];
  const runRate: ProgressionPoint[] = [];
  const worm: ProgressionPoint[] = [];

  const sortedInnings = [...inningsMap.entries()].sort((a, b) => a[0] - b[0]);

  for (const [inningsIndex, oversMap] of sortedInnings) {
    const isBatting = inningsIndex === 0;
    let cumRuns = 0;
    let cumLegal = 0;

    for (const [overNumber, data] of [
      ...oversMap.entries(),
    ].sort((a, b) => a[0] - b[0])) {
      cumRuns += data.runs;
      cumLegal += data.legalBalls;
      const rate =
        cumLegal > 0
          ? Number(((cumRuns / cumLegal) * 6).toFixed(2))
          : 0;
      const label = `I${inningsIndex + 1}.${overNumber + 1}`;

      overs.push({
        label,
        batting: isBatting ? data.runs : null,
        bowling: isBatting ? null : data.runs,
      });
      runRate.push({
        label,
        batting: isBatting ? rate : null,
        bowling: isBatting ? null : rate,
      });
      worm.push({
        label,
        batting: isBatting ? cumRuns : null,
        bowling: isBatting ? null : cumRuns,
      });
    }
  }

  return { overs, runRate, worm };
}
