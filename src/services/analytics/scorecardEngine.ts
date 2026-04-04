
import {  getMatchState } from "../matchEngine";
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

function getInningsEvents(matchId: string, inningsIndex: number): BallEvent[] {
  const match = getMatchState(matchId);
  if (!match) return [];

  const innings = match.innings?.[inningsIndex];
  if (!innings) return [];

  const events: BallEvent[] = [];

  Object.keys(innings.overs)
    .map(Number)
    .sort((a, b) => a - b) // ✅ IMPORTANT
    .forEach(over => {
      events.push(...innings.overs[over]);
    });

  return events;
}
/* ================= BATTING ================= */

export function getBattingStats(
  matchId: string,
  inningsIndex: number
) {
  const events = getInningsEvents(matchId, inningsIndex);
  const stats: Record<string, {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    out: boolean;
  }> = {};

  events.forEach(e => {
  if (!e.batsman) return; // ✅ FIRST LINE (FIX)

  const name = e.batsman;

  if (!stats[name]) {
    stats[name] = {
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      out: false,
    };
  }

  if (e.type === "RUN") stats[name].runs += e.runs;
  if (e.type === "FOUR") {
    stats[name].runs += 4;
    stats[name].fours++;
  }
  if (e.type === "SIX") {
    stats[name].runs += 6;
    stats[name].sixes++;
  }

  if (e.type !== "WD" && e.type !== "NB") {
  stats[name].balls++;
}
if (e.wicket && e.batsman === name) {
  stats[name].out = true;
}
  
});

  return stats;
}
/* ================= BOWLING ================= */

export function getBowlingStats(matchId: string, inningsIndex: number) {
  const match = getMatchState(matchId);

  if (!match) return {};

  const innings = match.innings?.[inningsIndex];

  if (!innings || !innings.bowlingStats) return {};

  const result: Record<
    string,
    { overs: number; runs: number; wickets: number }
  > = {};

  Object.entries(innings.bowlingStats).forEach(
    ([name, stats]) => {
      const overs =
        Math.floor(stats.balls / 6) + (stats.balls % 6) / 10;

      result[name] = {
        overs,
        runs: stats.runs,
        wickets: stats.wickets,
      };
    }
  );

  return result;
}
/* ================= FALL OF WICKETS ================= */

export function getFallOfWickets(
  matchId: string,
  inningsIndex: number
) {
 const events = getInningsEvents(matchId, inningsIndex);

  const wickets: WicketEvent[] = [];

  let wicketCount = 0;
  let runningScore = 0;

  events.forEach((ball, index) => {
if (ball.type === "RUN") runningScore += ball.runs ?? 0;
if (ball.type === "FOUR") runningScore += 4;
if (ball.type === "SIX") runningScore += 6;

// ✅ INCLUDE EXTRAS IN TOTAL SCORE
if (ball.type === "WD") runningScore += 1;
if (ball.type === "NB") runningScore += 1;
if (ball.type === "BYE") runningScore += ball.runs ?? 0;
if (ball.type === "LB") runningScore += ball.runs ?? 0;

    if (ball.wicket) {
      wicketCount++;

      wickets.push({
        wicket: wicketCount,
        score: runningScore,
        player: ball.batsman || "Unknown",
        over: `${ball.over}`,
      });
    }
  });

  return wickets;
}
/* ================= EXTRAS ================= */
export function getExtras(
  matchId: string,
  inningsIndex: number
) {
  const events = getInningsEvents(matchId, inningsIndex);
  let wides = 0, noBalls = 0, byes = 0, legByes = 0;

  events.forEach(ball => {
    if (ball.type === "WD") wides++;
    if (ball.type === "NB") noBalls++;
    if (ball.type === "BYE") byes++;
    if (ball.type === "LB") legByes++;
  });

  return { wides, noBalls, byes, legByes };
}
