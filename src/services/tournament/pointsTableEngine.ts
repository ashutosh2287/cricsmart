// src/services/tournament/pointsTableEngine.ts

import { recordMatchResult } from "./tournamentStore";

export type MatchResult = {
  matchId: string;
  teamA: string;
  teamB: string;
  winner: string;
  teamARuns: number;
  teamBRuns: number;
  overs: number;
};

/*
------------------------------------------------
Calculate Net Run Rate Difference
------------------------------------------------
*/

function computeRunRateDiff(
  teamARuns: number,
  teamBRuns: number,
  overs: number
): number {

  const runRateA = teamARuns / overs;
  const runRateB = teamBRuns / overs;

  return runRateA - runRateB;
}

/*
------------------------------------------------
Process Match Result
------------------------------------------------
*/

export function processMatchResult(result: MatchResult) {

  const { teamA, teamB, winner, teamARuns, teamBRuns, overs } = result;

  const loser = winner === teamA ? teamB : teamA;

  const runRateDiff = computeRunRateDiff(
    teamARuns,
    teamBRuns,
    overs
  );

  recordMatchResult(winner, loser, runRateDiff);
}