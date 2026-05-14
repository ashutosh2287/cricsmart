import { logger } from "@/lib/logger";
import type { InferenceMode } from "@/services/ml/types";

const LATENCY_BUDGET_MS: Record<InferenceMode, number> = {
  LIVE: 150,
  REPLAY: 50,
  SIMULATION: 100,
};

export type ResilientInferenceInput<T> = {
  matchId: string;
  mode: InferenceMode;
  previousPrediction?: T;
  legacyPrediction: T;
  retries?: number;
  execute: () => T;
};

export type ResilientInferenceResult<T> = {
  value: T;
  fallbackUsed: boolean;
  retryCount: number;
  latencyMs: number;
};

function isValidProbability(value: unknown): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function runResilientInference<T>(input: ResilientInferenceInput<T>): ResilientInferenceResult<T> {
  const maxRetries = Math.max(0, input.retries ?? 1);
  const startedAt = Date.now();

  let lastError: unknown;

  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const value = input.execute();
      const latencyMs = Date.now() - startedAt;

      if (!isValidProbability(value)) {
        throw new Error("invalid_prediction");
      }

      if (latencyMs > LATENCY_BUDGET_MS[input.mode]) {
        throw new Error(`latency_budget_exceeded_${LATENCY_BUDGET_MS[input.mode]}`);
      }

      return {
        value,
        fallbackUsed: false,
        retryCount: retry,
        latencyMs,
      };
    } catch (error) {
      lastError = error;
    }
  }

  const latencyMs = Date.now() - startedAt;
  const fallbackValue = input.previousPrediction ?? input.legacyPrediction;

  logger.warn("ML", "prediction_fallback_used", {
    matchId: input.matchId,
    mode: input.mode,
    retries: maxRetries,
    latencyMs,
    reason: lastError instanceof Error ? lastError.message : String(lastError),
  });

  return {
    value: fallbackValue,
    fallbackUsed: true,
    retryCount: maxRetries,
    latencyMs,
  };
}

export function getLatencyBudget(mode: InferenceMode): number {
  return LATENCY_BUDGET_MS[mode];
}
