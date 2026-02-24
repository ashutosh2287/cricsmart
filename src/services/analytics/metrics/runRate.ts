import { BallEvent } from "@/types/ballEvent";

export function calculateRunRate(events: BallEvent[]): number[] {

  let runs = 0;
  let balls = 0;

  const result: number[] = [];

  for (const e of events) {

    runs += e.runs ?? 0;

    if (e.isLegalDelivery) {
      balls++;
    }

    const overs = balls / 6;
    result.push(overs > 0 ? runs / overs : 0);
  }

  return result;
}