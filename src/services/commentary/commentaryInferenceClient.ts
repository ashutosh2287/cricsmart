import type { CommentaryContextSignals, CommentaryToneType } from "@/types/commentary";

type InferenceRequest = {
  baseText: string;
  tone: CommentaryToneType;
  context: CommentaryContextSignals;
  cacheKey: string;
};

type InferenceResponse = {
  text: string;
  model: string;
  cacheHit: boolean;
};

type InferenceStats = {
  requestCount: number;
  fallbackCount: number;
  cacheHits: number;
  totalLatencyMs: number;
};

const inferenceCache = new Map<string, InferenceResponse>();
const stats: InferenceStats = {
  requestCount: 0,
  fallbackCount: 0,
  cacheHits: 0,
  totalLatencyMs: 0,
};

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
    stats.totalLatencyMs += Date.now() - start;
    return { ...cached, cacheHit: true };
  }

  const text = enrichFromTone(request.baseText, request.tone);
  const response: InferenceResponse = {
    text,
    model: mode === "mock" ? "mock-tone-enricher-v1" : "hybrid-template-v1",
    cacheHit: false,
  };

  inferenceCache.set(request.cacheKey, response);
  stats.totalLatencyMs += Date.now() - start;
  return response;
}

export function getCommentaryInferenceStats() {
  const requestCount = stats.requestCount;
  const avgLatencyMs = requestCount > 0 ? stats.totalLatencyMs / requestCount : 0;
  const cacheHitRate = requestCount > 0 ? stats.cacheHits / requestCount : 0;

  return {
    mode: getInferenceMode(),
    model: getInferenceMode() === "mock" ? "mock-tone-enricher-v1" : "hybrid-template-v1",
    requestCount,
    fallbackCount: stats.fallbackCount,
    cacheHits: stats.cacheHits,
    cacheHitRate,
    avgLatencyMs,
    cacheSize: inferenceCache.size,
  };
}
