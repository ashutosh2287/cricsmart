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
PURE LAST 6 BALL MOMENTUM MODEL
Replay Safe
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

  score += runs * 2;
  score -= wickets * 15;
  score -= dots * 2;
  score += boundaries * 5;

  score = Math.max(-100, Math.min(100, score));

  let arc: MiniArc = "NEUTRAL";

  if (score > 25) arc = "SURGE";
  else if (score < -30) arc = "COLLAPSE";
  else if (dots >= 4) arc = "STALL";

  return { score, arc };
}