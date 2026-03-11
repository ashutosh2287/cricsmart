import { getEventStream } from "../matchEngine";
import { BallEvent } from "@/types/ballEvent";

export type Partnership = {
  runs: number;
  balls: number;
  runRate: number;
};

export function computeCurrentPartnership(
  matchId: string
): Partnership | null {

  const events = getEventStream(matchId);

  if (!events.length) return null;

  let runs = 0;
  let balls = 0;

  for (let i = events.length - 1; i >= 0; i--) {

    const e = events[i];

    if (!e.valid) continue;

    if (e.wicket) break;

    runs += e.runs ?? 0;

    if (e.isLegalDelivery) {
      balls++;
    }

  }

  if (balls === 0) return null;

  const overs = Math.max(1, balls) / 6;

  return {
    runs,
    balls,
    runRate: runs / overs
  };

}