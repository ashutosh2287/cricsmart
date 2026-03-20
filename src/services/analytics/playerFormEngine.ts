import { getPlayerStats } from "./playerStatsEngine";

export type PlayerFormPoint = {
  matchId: string;
  runs: number;
};

const playerFormStore: Record<string, PlayerFormPoint[]> = {};

export function updatePlayerForm(matchId: string) {

  const stats = getPlayerStats(matchId) ?? {};

  Object.entries(stats).forEach(([playerId, s]) => {

    let runs = 0;

    if (typeof s === "object" && s !== null) {

      if ("runs" in s) {
        runs = Number((s as { runs: number }).runs);
      }

      if ("totalRuns" in s) {
        runs = Number((s as { totalRuns: number }).totalRuns);
      }

    }

    const prev = playerFormStore[playerId] || [];

    playerFormStore[playerId] = [
      ...prev,
      {
        matchId,
        runs
      }
    ];

  });

}

export function getPlayerForm(playerId: string) {
  return playerFormStore[playerId] ?? [];
}