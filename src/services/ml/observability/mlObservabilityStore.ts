import { getCalibrationManifest } from "@/services/ml/calibration/calibrationManifest";
import { getActiveWinProbabilityFeatureContract } from "@/services/ml/schema/featureContracts";
import { getPredictionStabilityMetrics } from "@/services/ml/smoothing/stabilityMetrics";

export type MlRequestMetric = {
  matchId: string;
  mode: "LIVE" | "REPLAY" | "SIMULATION" | "MOCK";
  latencyMs: number;
  fallbackUsed: boolean;
  timestamp: number;
};

type RuntimePredictionMetric = {
  matchId: string;
  source: "LIVE" | "REPLAY" | "SIMULATION" | "MOCK";
  modelVersion: string;
  latencyMs: number;
  smoothing: {
    previousProbability: number | null;
    rawProbability: number;
    smoothedProbability: number;
    previousWeight: number;
    currentWeight: number;
  };
};

type MlObservabilityState = {
  requestCount: number;
  fallbackCount: number;
  schemaMismatchCount: number;
  calibrationLoadedCount: number;
  recentRequests: MlRequestMetric[];
  activeModelVersion: string;
  activeFeatureSchemaVersion: string;
  runtimePredictionCount: number;
  runtimePredictionTotalLatencyMs: number;
  featureValidationFailureCount: number;
  recentValidationFailures: { matchId: string; errors: string[]; timestamp: number }[];
  lastSmoothingState: RuntimePredictionMetric["smoothing"] | null;
};

const state: MlObservabilityState = {
  requestCount: 0,
  fallbackCount: 0,
  schemaMismatchCount: 0,
  calibrationLoadedCount: 0,
  recentRequests: [],
  activeModelVersion: "legacy-winprob-wrapper.v1",
  activeFeatureSchemaVersion: getActiveWinProbabilityFeatureContract().version,
  runtimePredictionCount: 0,
  runtimePredictionTotalLatencyMs: 0,
  featureValidationFailureCount: 0,
  recentValidationFailures: [],
  lastSmoothingState: null,
};

export function markSchemaMismatch() {
  state.schemaMismatchCount += 1;
}

export function markCalibrationLoaded(modelVersion: string, schemaVersion: string) {
  state.calibrationLoadedCount += 1;
  state.activeModelVersion = modelVersion;
  state.activeFeatureSchemaVersion = schemaVersion;
}

export function recordMlRequest(metric: MlRequestMetric) {
  state.requestCount += 1;
  if (metric.fallbackUsed) {
    state.fallbackCount += 1;
  }

  state.recentRequests = [metric, ...state.recentRequests].slice(0, 30);
}

export function recordRuntimeValidationFailure(matchId: string, errors: string[]) {
  state.featureValidationFailureCount += 1;
  state.recentValidationFailures = [
    {
      matchId,
      errors,
      timestamp: Date.now(),
    },
    ...state.recentValidationFailures,
  ].slice(0, 30);
}

export function recordRuntimePrediction(metric: RuntimePredictionMetric) {
  state.runtimePredictionCount += 1;
  state.runtimePredictionTotalLatencyMs += metric.latencyMs;
  state.activeModelVersion = metric.modelVersion;
  state.lastSmoothingState = metric.smoothing;
}

export function getMlDiagnostics(matchId?: string) {
  const calibration = getCalibrationManifest();
  const filtered = matchId
    ? state.recentRequests.filter((request) => request.matchId === matchId)
    : state.recentRequests;

  const avgLatencyMs = filtered.length
    ? filtered.reduce((sum, request) => sum + request.latencyMs, 0) / filtered.length
    : 0;
  const avgRuntimePredictionLatencyMs = state.runtimePredictionCount
    ? state.runtimePredictionTotalLatencyMs / state.runtimePredictionCount
    : 0;

  return {
    modelVersion: state.activeModelVersion,
    featureSchemaVersion: state.activeFeatureSchemaVersion,
    requestCount: state.requestCount,
    fallbackCount: state.fallbackCount,
    schemaMismatchCount: state.schemaMismatchCount,
    calibrationLoadedCount: state.calibrationLoadedCount,
    avgLatencyMs,
    runtimePredictionCount: state.runtimePredictionCount,
    avgRuntimePredictionLatencyMs,
    featureValidationFailureCount: state.featureValidationFailureCount,
    recentValidationFailures: matchId
      ? state.recentValidationFailures.filter((entry) => entry.matchId === matchId)
      : state.recentValidationFailures,
    lastSmoothingState: state.lastSmoothingState,
    calibration,
    recentRequests: filtered,
    matchStability: matchId ? getPredictionStabilityMetrics(matchId) : null,
  };
}
