import { getMatchState } from "../matchEngine";
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

export function getBattingStats(matchId: string): Record<string, BatterStats> {

  const match = getMatchState(matchId);
  if (!match) return {};

  const innings = match.innings[match.currentInningsIndex];

  const stats: Record<string, BatterStats> = {}; // ✅ FIX 2

  Object.values(innings.overs).forEach((over: BallEvent[]) => {
    over.forEach((ball: BallEvent) => {

      const name = ball.batsman;

      if (!stats[name]) {
        stats[name] = { runs: 0, balls: 0 };
      }

      stats[name].runs += ball.runs;
      stats[name].balls += 1;

    });
  });

  return stats;
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

  Object.values(innings.overs).forEach((over: BallEvent[], oIndex: number) => {

    over.forEach((ball: BallEvent, bIndex: number) => {

      if (ball.wicket) {
        wicketCount++;

        wickets.push({
          wicket: wicketCount,
          score: innings.runs,
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