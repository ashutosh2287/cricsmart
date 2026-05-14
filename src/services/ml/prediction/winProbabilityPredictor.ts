import { getWinProbabilityDebounceMs, getWinProbabilityMode, isMlWinProbabilityEnabled } from "@/config/mlMode";
import { BallEvent } from "@/types/ballEvent";
import { MatchState } from "@/services/matchEngine";
import { computeWinProbability } from "@/services/winProbabilityEngine";
import { generateWinProbabilityFeatures } from "@/services/ml/features/generateWinProbabilityFeatures";
import {
  normalizeWinProbabilityFeatures,
  validateWinProbabilityFeatures,
} from "@/services/ml/features/featureNormalizer";
import { NormalizedWinProbabilityFeatures } from "@/services/ml/features/featureTypes";
import { recordPredictionLog } from "./predictionMetricsStore";

export type WinPredictionResult = {
  battingWinProbability: number;
  bowlingWinProbability: number;
  confidence: number;
  modelVersion: string;
  latencyMs: number;
  cacheHit: boolean;
  debounced: boolean;
  features: NormalizedWinProbabilityFeatures;
};

type CacheEntry = {
  key: string;
  result: WinPredictionResult;
  timestamp: number;
};

const cacheByStateKey = new Map<string, CacheEntry>();
const perMatchLast = new Map<string, CacheEntry>();

function toStateKey(matchId: string, f: NormalizedWinProbabilityFeatures): string {
  return [
    matchId,
    f.innings,
    f.oversCompleted.toFixed(3),
    f.currentScore,
    f.wicketsLost,
    f.target,
    f.requiredRunRate.toFixed(4),
    f.currentRunRate.toFixed(4),
    f.recentRuns,
    f.recentWickets,
    f.partnershipRuns,
  ].join("|");
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function computeLocalMlProbability(features: NormalizedWinProbabilityFeatures): number {
  const pressure = features.requiredRunRate - features.currentRunRate;
  const wicketPenalty = features.wicketsLost * 0.08;
  const momentumBoost = (features.recentRuns / 36) * 0.45;
  const recentWicketPenalty = (features.recentWickets / 6) * 0.35;
  const phasePressure = features.phaseOfMatch === 2 ? 0.1 : features.phaseOfMatch === 1 ? 0.03 : 0;
  const partnershipBoost = Math.min(0.25, features.partnershipRuns / 120);

  const firstInningsAnchor = features.innings === 1
    ? ((features.currentRunRate - 8) * 0.2) - wicketPenalty + momentumBoost - recentWicketPenalty
    : 0;

  const chaseAnchor = features.innings === 2
    ? (-pressure * 0.22) - wicketPenalty + momentumBoost - recentWicketPenalty - phasePressure + partnershipBoost
    : 0;

  const z = firstInningsAnchor + chaseAnchor;
  const probability = 1 / (1 + Math.exp(-z));
  return clamp(probability * 100, 1, 99);
}

function confidenceFromProbability(probability: number): number {
  const normalized = Math.abs((probability / 100) - 0.5) * 2;
  return Math.min(1, Math.max(0.05, normalized));
}

function buildFallbackResult(
  matchId: string,
  state: MatchState,
  features: NormalizedWinProbabilityFeatures,
  cacheHit: boolean,
  debounced: boolean
): WinPredictionResult {
  const started = Date.now();
  const fallback = computeWinProbability(state);
  const batting = fallback?.battingWinProbability ?? 50;
  const bowling = fallback?.bowlingWinProbability ?? 50;
  const latencyMs = Date.now() - started;

  const result: WinPredictionResult = {
    battingWinProbability: batting,
    bowlingWinProbability: bowling,
    confidence: confidenceFromProbability(batting),
    modelVersion: "legacy-rule-engine",
    latencyMs,
    cacheHit,
    debounced,
    features,
  };

  recordPredictionLog({
    matchId,
    timestamp: Date.now(),
    modelVersion: result.modelVersion,
    latencyMs: result.latencyMs,
    cacheHit,
    features,
    prediction: {
      battingWinProbability: batting,
      bowlingWinProbability: bowling,
      confidence: result.confidence,
    },
  });

  return result;
}

export function predictWinProbabilityFromState(
  matchId: string,
  state: MatchState,
  eventStream: BallEvent[]
): WinPredictionResult {
  const rawFeatures = generateWinProbabilityFeatures(state, eventStream);
  const validation = validateWinProbabilityFeatures(rawFeatures);
  const normalized = normalizeWinProbabilityFeatures(rawFeatures);

  if (!validation.ok) {
    return buildFallbackResult(matchId, state, normalized, false, false);
  }

  const key = toStateKey(matchId, normalized);
  const now = Date.now();

  const cached = cacheByStateKey.get(key);
  if (cached) {
    const result = { ...cached.result, cacheHit: true, debounced: false };
    recordPredictionLog({
      matchId,
      timestamp: now,
      modelVersion: result.modelVersion,
      latencyMs: result.latencyMs,
      cacheHit: true,
      features: normalized,
      prediction: {
        battingWinProbability: result.battingWinProbability,
        bowlingWinProbability: result.bowlingWinProbability,
        confidence: result.confidence,
      },
    });
    return result;
  }

  const last = perMatchLast.get(matchId);
  const debounceMs = getWinProbabilityDebounceMs();
  if (last && now - last.timestamp < debounceMs) {
    const result = { ...last.result, cacheHit: true, debounced: true };
    recordPredictionLog({
      matchId,
      timestamp: now,
      modelVersion: result.modelVersion,
      latencyMs: result.latencyMs,
      cacheHit: true,
      features: normalized,
      prediction: {
        battingWinProbability: result.battingWinProbability,
        bowlingWinProbability: result.bowlingWinProbability,
        confidence: result.confidence,
      },
    });
    return result;
  }

  if (!isMlWinProbabilityEnabled()) {
    const result = buildFallbackResult(matchId, state, normalized, false, false);
    cacheByStateKey.set(key, { key, result, timestamp: now });
    perMatchLast.set(matchId, { key, result, timestamp: now });
    return result;
  }

  const started = Date.now();
  const batting = computeLocalMlProbability(normalized);
  const result: WinPredictionResult = {
    battingWinProbability: batting,
    bowlingWinProbability: 100 - batting,
    confidence: confidenceFromProbability(batting),
    modelVersion: `ml-local-${getWinProbabilityMode()}`,
    latencyMs: Date.now() - started,
    cacheHit: false,
    debounced: false,
    features: normalized,
  };

  cacheByStateKey.set(key, { key, result, timestamp: now });
  perMatchLast.set(matchId, { key, result, timestamp: now });

  recordPredictionLog({
    matchId,
    timestamp: now,
    modelVersion: result.modelVersion,
    latencyMs: result.latencyMs,
    cacheHit: false,
    features: normalized,
    prediction: {
      battingWinProbability: result.battingWinProbability,
      bowlingWinProbability: result.bowlingWinProbability,
      confidence: result.confidence,
    },
  });

  return result;
}

export function getActivePredictionModelVersion(): string {
  return isMlWinProbabilityEnabled() ? `ml-local-${getWinProbabilityMode()}` : "legacy-rule-engine";
}
