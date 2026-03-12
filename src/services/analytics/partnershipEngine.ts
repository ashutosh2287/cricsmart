import { getEventStream } from "../matchEngine";

export type PartnershipThreat =
  | "LOW"
  | "BUILDING"
  | "DANGEROUS"
  | "MATCH_CHANGING";

export type Partnership = {
  runs: number;
  balls: number;
  runRate: number;
  threat: PartnershipThreat;
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

  const overs = balls / 6;

  const runRate = runs / Math.max(0.1, overs);

  /*
  ========================================
  Threat Detection Logic
  ========================================
  */

  let threat: PartnershipThreat = "LOW";

  if (runs >= 30 && balls <= 30) {
    threat = "BUILDING";
  }

  if (runs >= 50 && runRate >= 7) {
    threat = "DANGEROUS";
  }

  if (runs >= 80 && runRate >= 8) {
    threat = "MATCH_CHANGING";
  }

  return {
    runs,
    balls,
    runRate,
    threat
  };
}