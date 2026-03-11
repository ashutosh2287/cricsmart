import { getMatchState } from "../matchEngine";

export type RequiredRunRateResult = {
  runsRemaining: number;
  oversRemaining: number;
  requiredRunRate: number;
};

export function computeRequiredRunRate(
  matchId: string,
  target: number,
  totalOvers = 20
): RequiredRunRateResult | null {

  const state = getMatchState(matchId);
  if (!state) return null;

  const innings = state.innings[state.currentInningsIndex];
  if (!innings) return null;

  const runsRemaining = target - innings.runs;

  const oversBowled =
    innings.over + innings.ball / 6;

  const oversRemaining =
    totalOvers - oversBowled;

  if (oversRemaining <= 0) return null;

  const requiredRunRate =
    runsRemaining / oversRemaining;

  return {
    runsRemaining,
    oversRemaining,
    requiredRunRate
  };

}