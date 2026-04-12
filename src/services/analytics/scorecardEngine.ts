import { getMatchState } from "../matchEngine";
import { BallEvent, isWicketEvent } from "@/types/ballEvent";

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

  return Object.keys(innings.overs || {})
    .sort((a, b) => Number(a) - Number(b))
    .flatMap(over => innings.overs[Number(over)] || []);
}

export function getBattingStats(matchId: string, inningsIndex: number) {
  const events = getInningsEvents(matchId, inningsIndex);

  const stats: Record<
    string,
    { runs: number; balls: number; fours: number; sixes: number; out: boolean }
  > = {};

  events.forEach(e => {
    const name = e.batsman;

    if (!stats[name]) {
      stats[name] = {
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        out: false
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

    if (e.isLegalDelivery) {
      stats[name].balls++;
    }

    if (isWicketEvent(e) && e.dismissedBatsman === name) {
      stats[name].out = true;
    }
  });

  return stats;
}

export function getBowlingStats(matchId: string, inningsIndex: number) {
  const match = getMatchState(matchId);
  if (!match) return {};

  const innings = match.innings?.[inningsIndex];
  if (!innings || !innings.bowlingStats) return {};

  const result: Record<string, { overs: number; runs: number; wickets: number }> = {};

  Object.entries(innings.bowlingStats).forEach(([name, stats]) => {
    const overs = Math.floor(stats.balls / 6) + (stats.balls % 6) / 10;

    result[name] = {
      overs,
      runs: stats.runs,
      wickets: stats.wickets
    };
  });

  return result;
}

export function getFallOfWickets(matchId: string, inningsIndex: number) {
  const events = getInningsEvents(matchId, inningsIndex);

  const wickets: WicketEvent[] = [];
  let wicketCount = 0;
  let runningScore = 0;

  events.forEach(ball => {
    runningScore += ball.totalRuns;

    if (isWicketEvent(ball)) {
      wicketCount++;
      wickets.push({
        wicket: wicketCount,
        score: runningScore,
        player: ball.dismissedBatsman,
        over: `${ball.over}`
      });
    }
  });

  return wickets;
}

export function getExtras(matchId: string, inningsIndex: number) {
  const events = getInningsEvents(matchId, inningsIndex);

  let wides = 0;
  let noBalls = 0;
  let byes = 0;
  let legByes = 0;

  events.forEach(ball => {
    if (ball.type === "WD") wides += ball.extraRuns;
    if (ball.type === "NB") noBalls += ball.extraRuns;
    if (ball.type === "BYE") byes += ball.extraRuns;
    if (ball.type === "LB") legByes += ball.extraRuns;
  });

  return { wides, noBalls, byes, legByes };
}