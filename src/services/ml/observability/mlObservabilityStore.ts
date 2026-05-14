import { getCalibrationManifest } from "@/services/ml/calibration/calibrationManifest";
import { getActiveWinProbabilityFeatureContract } from "@/services/ml/schema/featureContracts";
import { getPredictionStabilityMetrics } from "@/services/ml/smoothing/stabilityMetrics";

export type MlRequestMetric = {
  matchId: string;
  mode: "LIVE" | "REPLAY" | "SIMULATION";
  latencyMs: number;
  fallbackUsed: boolean;
  timestamp: number;
};

type MlObservabilityState = {
  requestCount: number;
  fallbackCount: number;
  schemaMismatchCount: number;
  calibrationLoadedCount: number;
  recentRequests: MlRequestMetric[];
  activeModelVersion: string;
  activeFeatureSchemaVersion: string;
};

const state: MlObservabilityState = {
  requestCount: 0,
  fallbackCount: 0,
  schemaMismatchCount: 0,
  calibrationLoadedCount: 0,
  recentRequests: [],
  activeModelVersion: "legacy-winprob-wrapper.v1",
  activeFeatureSchemaVersion: getActiveWinProbabilityFeatureContract().version,
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

export function getMlDiagnostics(matchId?: string) {
  const calibration = getCalibrationManifest();
  const filtered = matchId
    ? state.recentRequests.filter((request) => request.matchId === matchId)
    : state.recentRequests;

  const avgLatencyMs = filtered.length
    ? filtered.reduce((sum, request) => sum + request.latencyMs, 0) / filtered.length
    : 0;

  return {
    modelVersion: state.activeModelVersion,
    featureSchemaVersion: state.activeFeatureSchemaVersion,
    requestCount: state.requestCount,
    fallbackCount: state.fallbackCount,
    schemaMismatchCount: state.schemaMismatchCount,
    calibrationLoadedCount: state.calibrationLoadedCount,
    avgLatencyMs,
    calibration,
    recentRequests: filtered,
    matchStability: matchId ? getPredictionStabilityMetrics(matchId) : null,
  };
}
