import { logger } from "@/lib/logger";
import { calibrateProbability } from "@/services/ml/calibration/calibrator";
import { runResilientInference } from "@/services/ml/inference/inferenceResilience";
import { recordMlRequest } from "@/services/ml/observability/mlObservabilityStore";
import {
  getActiveWinProbabilityFeatureContract,
  WIN_PROBABILITY_FEATURE_SCHEMA_VERSION,
} from "@/services/ml/schema/featureContracts";
import { validateFeaturePayloadCompatibility } from "@/services/ml/schema/schemaValidation";
import { smoothProbability } from "@/services/ml/smoothing/smoothingPolicy";
import { recordPredictionDelta } from "@/services/ml/smoothing/stabilityMetrics";
import { generateWinProbabilityFeaturePayload } from "@/services/ml/feature/winProbabilityFeatures";
import { recordPredictionSnapshot } from "@/services/ml/snapshots/featureSnapshotStore";
import type {
  InferenceMode,
  WinProbabilityExtensionInput,
  WinProbabilityExtensionOutput,
} from "@/services/ml/types";

const DEFAULT_MODEL_VERSION = "legacy-winprob-wrapper.v1";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function resolveMode(input: WinProbabilityExtensionInput): InferenceMode {
  if (!input.ballEvent?.eventSource) return "SIMULATION";
  if (input.ballEvent.eventSource === "REPLAY") return "REPLAY";
  if (input.ballEvent.eventSource === "LIVE_INGESTION") return "LIVE";
  return "SIMULATION";
}

export function runWinProbabilityExtension(
  input: WinProbabilityExtensionInput
): WinProbabilityExtensionOutput {
  const schemaVersion = WIN_PROBABILITY_FEATURE_SCHEMA_VERSION;
  const contract = getActiveWinProbabilityFeatureContract();
  const mode = resolveMode(input);

  const payload = generateWinProbabilityFeaturePayload({
    state: input.state,
    ballEvent: input.ballEvent,
    rawBattingProbability: input.rawBattingProbability,
    previousBattingProbability: input.previousBattingProbability,
  });

  const resilient = runResilientInference<number>({
    matchId: input.matchId,
    mode,
    previousPrediction: input.previousBattingProbability,
    legacyPrediction: input.rawBattingProbability,
    retries: 1,
    execute: () => {
      validateFeaturePayloadCompatibility(schemaVersion, payload);

      const calibrated = calibrateProbability(input.rawBattingProbability);
      const smoothing = smoothProbability({
        state: input.state,
        ballEvent: input.ballEvent,
        previousProbability: input.previousBattingProbability,
        currentProbability: calibrated,
      });

      logger.debug("ML", "prediction_smoothed", {
        matchId: input.matchId,
        applied: smoothing.applied,
        previousWeight: smoothing.previousWeight,
        currentWeight: smoothing.currentWeight,
        criticalMoment: smoothing.criticalMoment,
      });

      return smoothing.smoothedProbability;
    },
  });

  const finalProbability = clamp(resilient.value);
  const smoothing = smoothProbability({
    state: input.state,
    ballEvent: input.ballEvent,
    previousProbability: input.previousBattingProbability,
    currentProbability: finalProbability,
  });

  if (input.previousBattingProbability !== undefined) {
    recordPredictionDelta(input.matchId, finalProbability - input.previousBattingProbability);
  }

  const innings = input.state.innings[input.state.currentInningsIndex];
  recordPredictionSnapshot({
    matchId: input.matchId,
    innings: input.state.currentInningsIndex,
    over: innings.over,
    ball: innings.ball,
    timestamp: input.ballEvent?.timestamp ?? Date.now(),
    modelVersion: DEFAULT_MODEL_VERSION,
    featureSchemaVersion: schemaVersion,
    featurePayload: payload,
    rawBattingProbability: input.rawBattingProbability,
    battingProbability: finalProbability,
    fallbackUsed: resilient.fallbackUsed,
  });

  recordMlRequest({
    matchId: input.matchId,
    mode,
    fallbackUsed: resilient.fallbackUsed,
    latencyMs: resilient.latencyMs,
    timestamp: Date.now(),
  });

  logger.info("ML", "prediction_generated", {
    matchId: input.matchId,
    mode,
    modelVersion: DEFAULT_MODEL_VERSION,
    featureSchemaVersion: contract.version,
    fallbackUsed: resilient.fallbackUsed,
    latencyMs: resilient.latencyMs,
  });

  return {
    battingProbability: finalProbability,
    rawBattingProbability: input.rawBattingProbability,
    modelVersion: DEFAULT_MODEL_VERSION,
    featureSchemaVersion: schemaVersion,
    fallbackUsed: resilient.fallbackUsed,
    latencyMs: resilient.latencyMs,
    retryCount: resilient.retryCount,
    smoothing: {
      applied: smoothing.applied,
      previousWeight: smoothing.previousWeight,
      currentWeight: smoothing.currentWeight,
      criticalMoment: smoothing.criticalMoment,
    },
  };
}
