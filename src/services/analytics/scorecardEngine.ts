
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

function filterByInnings(events: BallEvent[], inningsIndex: number) {
  let currentInnings = 0;

  return events.filter((e, i) => {
    if (i > 0 && e.over === 0) {
      currentInnings++;
    }
    return currentInnings === inningsIndex;
  });
}

/* ================= BATTING ================= */

export function getBattingStats(
  matchId: string,
  inningsIndex: number
) {
  const allEvents = getEventStream(matchId);
  const events = filterByInnings(allEvents, inningsIndex);

  const stats: Record<string, {
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    out: boolean;
  }> = {};

  events.forEach(e => {
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

    if (e.isLegalDelivery) stats[name].balls++;

    if (e.wicket) stats[name].out = true;
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
  const allEvents = getEventStream(matchId);
  const events = filterByInnings(allEvents, inningsIndex);

  const wickets: WicketEvent[] = [];

  let wicketCount = 0;
  let runningScore = 0;

  events.forEach((ball, index) => {
    runningScore += ball.runs;

    if (ball.wicket) {
      wicketCount++;

      wickets.push({
        wicket: wicketCount,
        score: runningScore,
        player: ball.batsman,
        over: ball.over.toFixed(1),
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
  const allEvents = getEventStream(matchId);
  const events = filterByInnings(allEvents, inningsIndex);

  let wides = 0, noBalls = 0, byes = 0, legByes = 0;

  events.forEach(ball => {
    if (ball.type === "WD") wides++;
    if (ball.type === "NB") noBalls++;
    if (ball.type === "BYE") byes++;
    if (ball.type === "LB") legByes++;
  });

  return { wides, noBalls, byes, legByes };
}
