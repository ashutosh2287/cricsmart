import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";
import type { FeaturePayload } from "@/services/ml/types";
import { generateSharedFeatureContext } from "@/services/ml/feature/contextGenerators";

export function generateWinProbabilityFeaturePayload(input: {
  state: MatchState;
  ballEvent?: BallEvent;
  rawBattingProbability: number;
  previousBattingProbability?: number;
}): FeaturePayload {
  const { state, ballEvent, rawBattingProbability, previousBattingProbability } = input;
  const innings = state.innings[state.currentInningsIndex];
  const totalBalls = (state.configOvers ?? 20) * 6;
  const ballsBowled = innings.over * 6 + innings.ball;
  const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
  const runRate = ballsBowled > 0 ? (innings.runs / ballsBowled) * 6 : 0;

  const target = state.innings[0]?.runs ? state.innings[0].runs + 1 : 0;
  const requiredRate =
    state.currentInningsIndex === 1 && ballsRemaining > 0
      ? ((target - innings.runs) * 6) / ballsRemaining
      : 0;

  const shared = generateSharedFeatureContext(state, ballEvent);

  return {
    inningsIndex: state.currentInningsIndex,
    oversConfig: state.configOvers ?? 20,
    over: innings.over,
    ball: innings.ball,
    runs: innings.runs,
    wickets: innings.wickets,
    ballsRemaining,
    runRate,
    requiredRate,
    pressureMetric: shared.pressureMetric,
    momentumMetric: shared.momentumMetric,
    partnershipRuns: shared.partnershipRuns,
    battingStabilityMetric: shared.battingStabilityMetric,
    rawBattingProbability,
    previousBattingProbability: previousBattingProbability ?? rawBattingProbability,
  };
}
