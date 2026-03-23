import { getEventStream } from "../matchEngine";
import { getHighlights } from "../highlights/highlightStore";

export type MomentumSwingType =
  | "BATTING_SURGE"
  | "BOWLING_STRIKE"
  | "MATCH_SHIFT"
  | "TURNING_POINT";

export type MomentumSwing = {
  ballIndex: number;
  type: MomentumSwingType;
  impact: number;
};

const swingStore: Record<string, MomentumSwing[]> = {};
const lastSwingIndex: Record<string, number> = {};

export function getMomentumSwings(matchId: string) {
  return swingStore[matchId] ?? [];
}

export function detectMomentumSwing(matchId: string) {

  const events = getEventStream(matchId);
  const highlights = getHighlights(matchId);

  if (events.length < 4) return;

  const swings: MomentumSwing[] = [];

  for (let i = 3; i < events.length; i++) {

    // 🔥 COOLDOWN (avoid spam)
    if (lastSwingIndex[matchId] !== undefined) {
      if (i - lastSwingIndex[matchId] < 3) continue;
    }

    const window = events.slice(i - 3, i + 1);

    let runs = 0;
    let wickets = 0;
    let boundaries = 0;

    window.forEach(e => {

      if (!e.valid) return;

      runs += e.runs ?? 0;

      if (e.wicket) wickets++;

      if (e.type === "FOUR" || e.type === "SIX") {
        boundaries++;
      }

    });

    /*
    =========================================
    🔥 TURNING POINT SYNC (HIGHEST PRIORITY)
    =========================================
    */

    const lastHighlight = highlights[highlights.length - 1];

    if (lastHighlight?.type === "TURNING_POINT") {

      swings.push({
        ballIndex: i,
        type: "TURNING_POINT",
        impact: 1.0 // 🔥 strongest
      });

      lastSwingIndex[matchId] = i;
      continue;
    }

    /*
    =========================================
    🎯 BOWLING STRIKE (STRONG)
    =========================================
    */

    if (wickets >= 2) {

      swings.push({
        ballIndex: i,
        type: "BOWLING_STRIKE",
        impact: 0.9
      });

      lastSwingIndex[matchId] = i;
      continue;
    }

    /*
    =========================================
    💥 BATTING SURGE (SMART)
    =========================================
    */

    if (runs >= 14 && boundaries >= 2) {

      swings.push({
        ballIndex: i,
        type: "BATTING_SURGE",
        impact: 0.85
      });

      lastSwingIndex[matchId] = i;
      continue;
    }

    /*
    =========================================
    ⚡ MATCH SHIFT (CONTROLLED)
    =========================================
    */

    if (runs >= 10 || wickets === 1) {

      swings.push({
        ballIndex: i,
        type: "MATCH_SHIFT",
        impact: 0.6
      });

      lastSwingIndex[matchId] = i;
    }

  }

  swingStore[matchId] = swings;
}