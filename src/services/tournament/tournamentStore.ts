// src/services/tournament/tournamentStore.ts

export type TeamStanding = {
  team: string;
  matches: number;
  wins: number;
  losses: number;
  points: number;
  netRunRate: number;
};

const standings: Record<string, TeamStanding> = {};

export function registerTeam(team: string) {
  if (!standings[team]) {
    standings[team] = {
      team,
      matches: 0,
      wins: 0,
      losses: 0,
      points: 0,
      netRunRate: 0,
    };
  }
}

export function recordMatchResult(
  winner: string,
  loser: string,
  runRateDiff: number
) {
  registerTeam(winner);
  registerTeam(loser);

  standings[winner].matches += 1;
  standings[winner].wins += 1;
  standings[winner].points += 2;
  standings[winner].netRunRate += runRateDiff;

  standings[loser].matches += 1;
  standings[loser].losses += 1;
  standings[loser].netRunRate -= runRateDiff;
}

export function getPointsTable(): TeamStanding[] {
  return Object.values(standings).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.netRunRate - a.netRunRate;
  });
}