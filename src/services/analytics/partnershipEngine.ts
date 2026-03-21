import { getMatchState } from "../matchEngine";

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
  striker?: string;
  nonStriker?: string;
};

export function computeCurrentPartnership(
  matchId: string
): Partnership | null {

  

  const matchState = getMatchState(matchId);
  if (!matchState) return null;

  const innings =
    matchState.innings[matchState.currentInningsIndex];
    const allBalls = Object.values(innings.overs).flat();

const lastBall = allBalls[allBalls.length - 1];

const striker = lastBall?.batsman ?? "";
const nonStriker = lastBall?.nonStriker ?? "";

  if (!innings) return null;

  let runs = 0;
  let balls = 0;

  // ✅ Flatten only CURRENT innings balls

  // 🔁 Traverse backwards
  for (let i = allBalls.length - 1; i >= 0; i--) {

    const ball = allBalls[i];
    if (!ball) continue;

    // ❗ STOP at last wicket
    if (ball.wicket) break;

    runs += ball.runs ?? 0;

    if (ball.isLegalDelivery) {
      balls++;
    }
  }

  if (balls === 0) return null;

  const runRate = (runs / balls) * 6;

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
    threat,
    striker,
    nonStriker
  };
}