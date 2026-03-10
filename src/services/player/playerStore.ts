// src/services/player/playerStore.ts

export type PlayerStats = {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  wickets: number;
  ballsBowled: number;
};

const playerStats: Record<string, PlayerStats> = {};

export function registerPlayer(name: string) {

  if (!playerStats[name]) {
    playerStats[name] = {
      name,
      runs: 0,
      balls: 0,
      fours: 0,
      sixes: 0,
      wickets: 0,
      ballsBowled: 0,
    };
  }

}

export function addBattingEvent(
  player: string,
  runs: number,
  type?: string
) {

  registerPlayer(player);

  const stats = playerStats[player];

  stats.runs += runs;
  stats.balls += 1;

  if (type === "FOUR") stats.fours += 1;
  if (type === "SIX") stats.sixes += 1;

}

export function addBowlingEvent(
  bowler: string,
  wicket: boolean
) {

  registerPlayer(bowler);

  const stats = playerStats[bowler];

  stats.ballsBowled += 1;

  if (wicket) {
    stats.wickets += 1;
  }

}

export function getPlayerStats(player: string) {
  return playerStats[player];
}

export function getAllPlayers() {
  return Object.values(playerStats);
}