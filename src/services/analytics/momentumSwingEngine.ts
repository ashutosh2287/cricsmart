import { getEventStream } from "../matchEngine";

export type MomentumSwingType =
  | "BATTING_SURGE"
  | "BOWLING_STRIKE"
  | "MATCH_SHIFT";

export type MomentumSwing = {
  ballIndex: number;
  type: MomentumSwingType;
  impact: number;
};

const swingStore: Record<string, MomentumSwing[]> = {};

export function getMomentumSwings(matchId: string) {
  return swingStore[matchId] ?? [];
}

export function detectMomentumSwing(matchId: string) {

  const events = getEventStream(matchId);

  if (events.length < 3) return;

  const swings: MomentumSwing[] = [];

  for (let i = 2; i < events.length; i++) {

    const window = events.slice(i - 2, i + 1);

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
    ==========================
    Bowling Strike Swing
    ==========================
    */

    if (wickets >= 2) {

      swings.push({
        ballIndex: i,
        type: "BOWLING_STRIKE",
        impact: 0.9
      });

      continue;
    }

    /*
    ==========================
    Batting Surge
    ==========================
    */

    if (runs >= 12 && boundaries >= 2) {

      swings.push({
        ballIndex: i,
        type: "BATTING_SURGE",
        impact: 0.8
      });

      continue;
    }

    /*
    ==========================
    Match Shift
    ==========================
    */

    if (runs >= 10 || wickets === 1) {

      swings.push({
        ballIndex: i,
        type: "MATCH_SHIFT",
        impact: 0.6
      });

    }

  }

  swingStore[matchId] = swings;

}