import type { MatchState } from "@/services/matchEngine";
import type { BallEvent } from "@/types/ballEvent";
import { logger } from "@/lib/logger";
import {
  type PredictionSource,
  type ProbabilityHistoryPoint,
  type WinProbabilityFeatures,
  type WinProbabilityPrediction,
} from "@/services/ml/contracts/winProbability";
import {
  getWinProbabilitySmoothingWeights,
  smoothWinProbability,
} from "@/services/ml/prediction/probabilitySmoothing";
import {
  recordRuntimePrediction,
  recordRuntimeValidationFailure,
} from "@/services/ml/observability/mlObservabilityStore";

const MODEL_VERSION = "win-probability-lgbm-runtime-v1";

export const FEATURE_COLUMNS: (keyof WinProbabilityFeatures)[] = [
  "innings",
  "over",
  "ball",
  "currentScore",
  "wicketsLost",
  "oversCompleted",
  "ballsRemaining",
  "targetValue",
  "requiredRunRate",
  "currentRunRate",
  "recentRuns",
  "recentWickets",
  "phaseOfMatch",
  "battingFirst",
  "partnershipRuns",
];

let runtimePredictionCount = 0;

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getPhaseOfMatch(over: number): number {
  if (over < 6) return 0;
  if (over < 15) return 1;
  return 2;
}

function calculateRecentRuns(events: BallEvent[]) {
  return events
    .slice(-6)
    .reduce((sum, event) => sum + (event.totalRuns ?? event.runs ?? 0), 0);
}

function calculateRecentWickets(events: BallEvent[]) {
  return events.slice(-6).reduce((sum, event) => sum + (event.wicket ? 1 : 0), 0);
}

function calculatePartnershipRuns(state: MatchState) {
  const innings = state.innings[state.currentInningsIndex];
  const deliveries = Object.values(innings?.overs ?? {}).flat();
  let partnership = 0;

  for (let i = deliveries.length - 1; i >= 0; i -= 1) {
    const event = deliveries[i];
    partnership += event.totalRuns ?? event.runs ?? 0;
    if (event.wicket) break;
  }

  return partnership;
}

function inferProbabilityFromFeatures(features: WinProbabilityFeatures) {
  const pressure = features.requiredRunRate - features.currentRunRate;
  const wicketPenalty = features.wicketsLost * 0.08;
  const momentumBoost = (features.recentRuns / 36) * 0.45;
  const recentWicketPenalty = (features.recentWickets / 6) * 0.35;
  const phasePressure = features.phaseOfMatch === 2 ? 0.1 : features.phaseOfMatch === 1 ? 0.03 : 0;
  const partnershipBoost = Math.min(0.25, features.partnershipRuns / 120);

  const firstInningsAnchor =
    features.innings === 1
      ? (features.currentRunRate - 8) * 0.2 - wicketPenalty + momentumBoost - recentWicketPenalty
      : 0;
  const chaseAnchor =
    features.innings === 2
      ? -pressure * 0.22 - wicketPenalty + momentumBoost - recentWicketPenalty - phasePressure + partnershipBoost
      : 0;

  const z = firstInningsAnchor + chaseAnchor;
  const probability = 1 / (1 + Math.exp(-z));
  return clamp(probability * 100, 1, 99);
}

function confidenceFromProbability(probability: number) {
  const normalized = Math.abs(probability / 100 - 0.5) * 2;
  return Math.min(1, Math.max(0.05, normalized));
}

export function buildRuntimeWinProbabilityFeatures(
  state: MatchState,
  eventStream: BallEvent[]
): WinProbabilityFeatures {
  const inningsIndex = state.currentInningsIndex;
  const innings = state.innings[inningsIndex];
  const over = Number(innings?.over ?? 0);
  const ball = Number(innings?.ball ?? 0);
  const currentScore = Number(innings?.runs ?? 0);
  const wicketsLost = Number(innings?.wickets ?? 0);
  const ballsBowled = over * 6 + ball;
  const totalBalls = (state.configOvers ?? 20) * 6;
  const ballsRemaining = Math.max(0, totalBalls - ballsBowled);
  const targetValue = inningsIndex === 1 ? Math.max(0, (state.innings[0]?.runs ?? 0) + 1) : 0;
  const requiredRuns = inningsIndex === 1 ? Math.max(0, targetValue - currentScore) : 0;
  const requiredRunRate = inningsIndex === 1 && ballsRemaining > 0 ? (requiredRuns * 6) / ballsRemaining : 0;
  const currentRunRate = ballsBowled > 0 ? (currentScore * 6) / ballsBowled : 0;

  return {
    innings: inningsIndex === 0 ? 1 : 2,
    over,
    ball,
    currentScore,
    wicketsLost,
    oversCompleted: over + ball / 6,
    ballsRemaining,
    targetValue,
    requiredRunRate,
    currentRunRate,
    recentRuns: calculateRecentRuns(eventStream),
    recentWickets: calculateRecentWickets(eventStream),
    phaseOfMatch: getPhaseOfMatch(over),
    battingFirst: inningsIndex === 0 ? 1 : 0,
    partnershipRuns: calculatePartnershipRuns(state),
  };
}

export function validateRuntimeWinProbabilityFeatures(features: WinProbabilityFeatures) {
  const errors: string[] = [];

  for (const column of FEATURE_COLUMNS) {
    const value = features[column];
    if (value === undefined || value === null) {
      errors.push(`${column}:undefined`);
      continue;
    }
    if (Number.isNaN(value)) {
      errors.push(`${column}:nan`);
      continue;
    }
    if (!Number.isFinite(value)) {
      errors.push(`${column}:non_finite`);
      continue;
    }
  }

  if (features.ballsRemaining < 0) {
    errors.push("ballsRemaining:negative");
  }

  if (features.innings === 1 && features.targetValue !== 0) {
    errors.push("targetValue:first_innings_must_be_zero");
  }

  if (features.innings === 2 && features.targetValue < 1) {
    errors.push("targetValue:second_innings_invalid");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function predictRuntimeWinProbability(input: {
  matchId: string;
  state: MatchState;
  eventStream: BallEvent[];
  source: PredictionSource;
  previousProbability?: number | null;
  timestamp?: number;
}): WinProbabilityPrediction | null {
  const features = buildRuntimeWinProbabilityFeatures(input.state, input.eventStream);
  const validation = validateRuntimeWinProbabilityFeatures(features);
  const startedAt = Date.now();

  if (!validation.ok) {
    recordRuntimeValidationFailure(input.matchId, validation.errors);
    logger.warn("ML", "runtime_feature_validation_failed", {
      matchId: input.matchId,
      errors: validation.errors,
    });
    return null;
  }

  const rawProbability = inferProbabilityFromFeatures(features);
  const previousProbability = input.previousProbability ?? null;
  const probability =
    previousProbability === null
      ? rawProbability
      : smoothWinProbability(previousProbability, rawProbability);
  const probabilityDelta = previousProbability === null ? 0 : probability - previousProbability;
  const latencyMs = Date.now() - startedAt;
  runtimePredictionCount += 1;

  const smoothingWeights = getWinProbabilitySmoothingWeights();

  recordRuntimePrediction({
    matchId: input.matchId,
    source: input.source,
    modelVersion: MODEL_VERSION,
    latencyMs,
    smoothing: {
      previousProbability,
      rawProbability,
      smoothedProbability: probability,
      previousWeight: smoothingWeights.previousWeight,
      currentWeight: smoothingWeights.currentWeight,
    },
  });

  return {
    probability,
    previousProbability,
    probabilityDelta,
    confidence: confidenceFromProbability(probability),
    rawProbability,
    features,
    metadata: {
      modelVersion: MODEL_VERSION,
      source: input.source,
      timestamp: input.timestamp ?? Date.now(),
      latencyMs,
      predictionCount: runtimePredictionCount,
      smoothing: {
        applied: previousProbability !== null,
        previousWeight: smoothingWeights.previousWeight,
        currentWeight: smoothingWeights.currentWeight,
      },
    },
  };
}

export function createProbabilityHistoryPoint(input: {
  matchId: string;
  features: WinProbabilityFeatures;
  probability: number;
  timestamp: number;
}): ProbabilityHistoryPoint {
  return {
    matchId: input.matchId,
    innings: input.features.innings,
    over: input.features.over,
    ball: input.features.ball,
    probability: input.probability,
    timestamp: input.timestamp,
  };
}

