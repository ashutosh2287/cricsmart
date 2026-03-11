import { getEventStream } from "../matchEngine";
import { BallEvent } from "@/types/ballEvent";

export type ProjectionResult = {
  projectedScore: number;
  currentRunRate: number;
};

export function computeProjectedScore(
  matchId: string,
  totalOvers = 20
): ProjectionResult | null {

  const events = getEventStream(matchId);

  if (!events.length) return null;

  let runs = 0;
  let balls = 0;

  for (const e of events) {

    if (!e.valid) continue;

    runs += e.runs ?? 0;

    if (e.isLegalDelivery) {
      balls++;
    }

  }

  if (balls === 0) return null;

  const overs = balls / 6;

  const currentRunRate = runs / overs;

  const projectedScore = Math.round(currentRunRate * totalOvers);

  return {
    projectedScore,
    currentRunRate
  };

}