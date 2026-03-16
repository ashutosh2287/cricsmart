import { getPlayerStats } from "./playerStatsEngine";

export type TopPerformers = {
  topScorer?: string;
  topBowler?: string;
  bestStrikeRate?: string;
};

export function computeTopPerformers(matchId: string): TopPerformers {

  const stats = getPlayerStats(matchId);

  let topScorer = "";
  let maxRuns = -1;

  let topBowler = "";
  let maxWickets = -1;

  let bestStrikeRate = "";
  let maxSR = -1;

  for (const [player, s] of Object.entries(stats)) {

    if (s.batting.runs > maxRuns) {
      maxRuns = s.batting.runs;
      topScorer = player;
    }

    if (s.bowling.wickets > maxWickets) {
      maxWickets = s.bowling.wickets;
      topBowler = player;
    }

    const sr =
      s.batting.balls > 0
        ? (s.batting.runs / s.batting.balls) * 100
        : 0;

    if (sr > maxSR) {
      maxSR = sr;
      bestStrikeRate = player;
    }

  }

  return {
    topScorer,
    topBowler,
    bestStrikeRate
  };
}