import { NormalizedWinProbabilityFeatures } from "@/services/ml/features/featureTypes";

export type PredictionLogEntry = {
  matchId: string;
  timestamp: number;
  modelVersion: string;
  latencyMs: number;
  cacheHit: boolean;
  features: NormalizedWinProbabilityFeatures;
  prediction: {
    battingWinProbability: number;
    bowlingWinProbability: number;
    confidence: number;
  };
};

const MAX_LOGS = 300;

const metrics = {
  requestCount: 0,
  cacheHits: 0,
  totalLatencyMs: 0,
  logs: [] as PredictionLogEntry[],
};

export function recordPredictionLog(entry: PredictionLogEntry) {
  metrics.requestCount += 1;
  if (entry.cacheHit) {
    metrics.cacheHits += 1;
  }
  metrics.totalLatencyMs += entry.latencyMs;

  metrics.logs.push(entry);
  if (metrics.logs.length > MAX_LOGS) {
    metrics.logs.shift();
  }
}

export function getPredictionMetrics() {
  return {
    requestCount: metrics.requestCount,
    cacheHits: metrics.cacheHits,
    cacheHitRate: metrics.requestCount > 0 ? metrics.cacheHits / metrics.requestCount : 0,
    avgLatencyMs: metrics.requestCount > 0 ? metrics.totalLatencyMs / metrics.requestCount : 0,
    recentLogs: [...metrics.logs],
  };
}
