import { BallEvent } from "@/types/ballEvent";

export type MiniArc =
  | "SURGE"
  | "STALL"
  | "COLLAPSE"
  | "NEUTRAL";

export type MomentumContext = {
  score: number; // -100 to +100
  arc: MiniArc;
};

/*
================================================
🔥 ADVANCED MOMENTUM MODEL (REALISTIC)
================================================
*/

export function computeMomentumContext(
  events: BallEvent[]
): MomentumContext {

  const lastSix = events
    .filter(e => e.isLegalDelivery)
    .slice(-6);

  if (lastSix.length === 0) {
    return { score: 0, arc: "NEUTRAL" };
  }

  let score = 0;
  let runs = 0;
  let wickets = 0;
  let dots = 0;
  let boundaries = 0;

  for (const e of lastSix) {

    runs += e.runs;

    if (e.wicket) wickets++;

    if (e.runs === 0) dots++;

    if (e.runs === 4 || e.runs === 6) {
      boundaries++;
    }
  }

  /*
  ============================================
  🔥 NEW WEIGHT MODEL
  ============================================
  */

  score += runs * 2;          // scoring pressure
  score -= wickets * 20;      // BIG penalty
  score -= dots * 3;          // dot pressure
  score += boundaries * 6;    // attacking boost

  score = Math.max(-100, Math.min(100, score));

  /*
  ============================================
  🔥 ARC DETECTION
  ============================================
  */

  let arc: MiniArc = "NEUTRAL";

  if (score > 30) arc = "SURGE";
  else if (score < -35) arc = "COLLAPSE";
  else if (dots >= 4) arc = "STALL";

  return { score, arc };
}