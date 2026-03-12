import { getEventStream } from "../matchEngine";

export type PlayerBattingStats = {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
};

export type PlayerBowlingStats = {
  balls: number;
  runs: number;
  wickets: number;
};

export type PlayerStats = {
  batting: PlayerBattingStats;
  bowling: PlayerBowlingStats;
};

const playerStatsStore: Record<
  string,
  Record<string, PlayerStats>
> = {};

export function updatePlayerStats(matchId: string) {

  const events = getEventStream(matchId);
  if (!events.length) return;

  const stats: Record<string, PlayerStats> = {};

  for (const e of events) {

    const batsman = e.batsman;
    const bowler = e.bowler;

    if (!batsman || !bowler) continue;

    if (!stats[batsman]) {
      stats[batsman] = {
        batting: { runs: 0, balls: 0, fours: 0, sixes: 0 },
        bowling: { balls: 0, runs: 0, wickets: 0 }
      };
    }

    if (!stats[bowler]) {
      stats[bowler] = {
        batting: { runs: 0, balls: 0, fours: 0, sixes: 0 },
        bowling: { balls: 0, runs: 0, wickets: 0 }
      };
    }

    // Batting stats
    if (e.isLegalDelivery) {
      stats[batsman].batting.balls++;
    }

    stats[batsman].batting.runs += e.runs ?? 0;

    if (e.type === "FOUR") {
      stats[batsman].batting.fours++;
    }

    if (e.type === "SIX") {
      stats[batsman].batting.sixes++;
    }

    // Bowling stats
    if (e.isLegalDelivery) {
      stats[bowler].bowling.balls++;
    }

    stats[bowler].bowling.runs += e.runs ?? 0;

    if (e.wicket) {
      stats[bowler].bowling.wickets++;
    }

  }

  playerStatsStore[matchId] = stats;

}

export function getPlayerStats(matchId: string) {
  return playerStatsStore[matchId] ?? {};
}

export function getPlayerStat(matchId: string, player: string) {
  const stats = getPlayerStats(matchId);
  return stats[player];
}