import type { CommentaryContextSignals, CommentaryToneType } from "@/types/commentary";

type InferenceRequest = {
  baseText: string;
  tone: CommentaryToneType;
  context: CommentaryContextSignals;
  cacheKey: string;
  mode?: "live" | "replay" | "simulation";
};

type InferenceResponse = {
  text: string;
  model: string;
  cacheHit: boolean;
  latencyMs: number;
  budgetOk: boolean;
};

type InferenceStats = {
  requestCount: number;
  fallbackCount: number;
  cacheHits: number;
  totalLatencyMs: number;
  overBudgetCount: number;
};

const inferenceCache = new Map<string, InferenceResponse>();
const stats: InferenceStats = {
  requestCount: 0,
  fallbackCount: 0,
  cacheHits: 0,
  totalLatencyMs: 0,
  overBudgetCount: 0,
};

const latencyBudgetMs = {
  live: 200,
  replay: 75,
  simulation: 100,
} as const;

function getInferenceMode() {
  return process.env.COMMENTARY_INFERENCE_MODE ?? "disabled";
}

function enrichFromTone(baseText: string, tone: CommentaryToneType) {
  if (tone === "dramatic") return `${baseText} Huge moment in this contest.`;
  if (tone === "analytical") return `${baseText} Tactical pressure is shaping this phase.`;
  if (tone === "tense") return `${baseText} Every ball now feels decisive.`;
  if (tone === "celebratory") return `${baseText} The crowd will enjoy that one.`;
  if (tone === "aggressive") return `${baseText} Intent is clearly on display.`;
  return baseText;
}

function budgetForMode(mode?: "live" | "replay" | "simulation") {
  return latencyBudgetMs[mode ?? "live"];
}

export function markCommentaryInferenceFallback() {
  stats.fallbackCount += 1;
}

export function enrichCommentary(request: InferenceRequest): InferenceResponse | null {
  const mode = getInferenceMode();
  if (mode === "disabled") {
    return null;
  }

  stats.requestCount += 1;
  const start = Date.now();

  const cached = inferenceCache.get(request.cacheKey);
  if (cached) {
    stats.cacheHits += 1;
    const latencyMs = Date.now() - start;
    stats.totalLatencyMs += latencyMs;
    return {
      ...cached,
      cacheHit: true,
      latencyMs,
      budgetOk: latencyMs <= budgetForMode(request.mode),
    };
  }

  const text = enrichFromTone(request.baseText, request.tone);
  const latencyMs = Date.now() - start;
  const budgetOk = latencyMs <= budgetForMode(request.mode);
  if (!budgetOk) stats.overBudgetCount += 1;

  const response: InferenceResponse = {
    text,
    model: mode === "mock" ? "mock-tone-enricher-v2" : "hybrid-template-v2",
    cacheHit: false,
    latencyMs,
    budgetOk,
  };

  inferenceCache.set(request.cacheKey, response);
  stats.totalLatencyMs += latencyMs;
  return response;
}

export function getCommentaryInferenceStats() {
  const requestCount = stats.requestCount;
  const avgLatencyMs = requestCount > 0 ? stats.totalLatencyMs / requestCount : 0;
  const cacheHitRate = requestCount > 0 ? stats.cacheHits / requestCount : 0;

  return {
    mode: getInferenceMode(),
    model: getInferenceMode() === "mock" ? "mock-tone-enricher-v2" : "hybrid-template-v2",
    requestCount,
    fallbackCount: stats.fallbackCount,
    cacheHits: stats.cacheHits,
    cacheHitRate,
    avgLatencyMs,
    overBudgetCount: stats.overBudgetCount,
    cacheSize: inferenceCache.size,
    latencyBudgetMs,
  };
}
