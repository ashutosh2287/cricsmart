import { BallEvent } from "@/types/ballEvent";

export function calculateMomentum(events: BallEvent[]): number[] {

  const window = 6; // last over
  const result: number[] = [];

  for (let i = 0; i < events.length; i++) {

    let score = 0;

    for (let j = Math.max(0, i - window); j <= i; j++) {
      score += events[j].runs ?? 0;
      if (events[j].wicket) score -= 5;
    }

    result.push(score);
  }

  return result;
}