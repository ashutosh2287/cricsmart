import { getEventStream, getMatchState } from "../matchEngine";
import { BallEvent } from "@/types/ballEvent"; // ✅ FIX 1

/* ================= TYPES ================= */

type BatterStats = {
  runs: number;
  balls: number;
};

type BowlerStats = {
  overs: number;
  runs: number;
  wickets: number;
};

type WicketEvent = {
  wicket: number;
  score: number;
  over: string;
  player: string;
};

/* ================= BATTING ================= */

export function getBattingStats(matchId: string) {

  const events = getEventStream(matchId);

  const batting: Record<string, {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    out: boolean;
  }> = {};

  for (const e of events) {

    const batsman = e.batsman;

    // 🔥 skip invalid players
    if (!batsman || batsman === "Unknown") continue;

    if (!batting[batsman]) {
      batting[batsman] = {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false
      };
    }

    // ✅ runs
    batting[batsman].runs += e.runs ?? 0;

    // ✅ balls (only legal)
    if (e.isLegalDelivery) {
      batting[batsman].balls++;
    }

    // ✅ boundaries
    if (e.type === "FOUR") batting[batsman].fours++;
    if (e.type === "SIX") batting[batsman].sixes++;

    // ✅ wicket
    if (e.wicket) {
      batting[batsman].out = true;
    }
  }
console.log(events.map(e => e.batsman));
  return batting;
}
/* ================= BOWLING ================= */

export function getBowlingStats(matchId: string): Record<string, BowlerStats> {

  const match = getMatchState(matchId);
  if (!match) return {};

  const innings = match.innings[match.currentInningsIndex];

  const stats: Record<string, BowlerStats> = {};

  Object.values(innings.overs).forEach((over: BallEvent[]) => {

    over.forEach((ball: BallEvent) => {

      const name = ball.bowler;

      if (!stats[name]) {
        stats[name] = { overs: 0, runs: 0, wickets: 0 };
      }

      stats[name].runs += ball.runs;

      if (ball.wicket) {
        stats[name].wickets += 1;
      }

    });

    // ✅ overs count
    if (over.length > 0) {
      const bowler = over[0].bowler;
      if (stats[bowler]) {
        stats[bowler].overs += 1;
      }
    }

  });

  return stats;
}

/* ================= FALL OF WICKETS ================= */

export function getFallOfWickets(matchId: string): WicketEvent[] {

  const match = getMatchState(matchId);
  if (!match) return [];

  const innings = match.innings[match.currentInningsIndex];

  const wickets: WicketEvent[] = [];

  let wicketCount = 0;
  let runningScore = 0;

  Object.values(innings.overs).forEach((over: BallEvent[], oIndex: number) => {

    over.forEach((ball: BallEvent, bIndex: number) => {

      runningScore += ball.runs;

      if (ball.wicket) {
        wicketCount++;

        wickets.push({
          wicket: wicketCount,
          score: runningScore, // ✅ FIXED
          player: ball.batsman,
          over: `${oIndex}.${bIndex}`
        });
      }

    });

  });

  return wickets;
}

/* ================= EXTRAS ================= */

export function getExtras(matchId: string) {

  const match = getMatchState(matchId);
  if (!match) return { wides: 0, noBalls: 0, byes: 0, legByes: 0 };

  const innings = match.innings[match.currentInningsIndex];

  let wides = 0, noBalls = 0, byes = 0, legByes = 0;

  Object.values(innings.overs).forEach((over: BallEvent[]) => {

    over.forEach((ball: BallEvent) => {

      if (ball.type === "WD") wides++;
      if (ball.type === "NB") noBalls++;
      if (ball.type === "BYE") byes++;
      if (ball.type === "LB") legByes++;

    });

  });

  return { wides, noBalls, byes, legByes };
}