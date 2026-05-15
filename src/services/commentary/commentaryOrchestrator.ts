import type { BallEvent } from "@/types/ballEvent";
import { getEventStream, getMatchState, type MatchState } from "@/services/matchEngine";
import { buildCommentaryContext } from "./commentaryContextBuilder";
import { evolveCommentaryNarrative } from "./commentaryNarrativeEngine";
import { classifyCommentarySituation } from "./commentarySituationClassifier";
import { selectCommentaryTone } from "./commentaryToneEngine";
import { validateCommentaryContext } from "./commentaryContextValidator";
import { appendCommentaryContextSnapshot, getCommentaryContextSnapshots } from "./commentaryContextSnapshotStore";
import { selectCommentaryGenerationStrategy } from "./commentaryStrategyEngine";
import { generateTemplateCommentary } from "./commentaryTemplateEngine";
import { retrieveSimilarCommentary } from "./commentaryRetrievalEngine";
import { enrichCommentaryNarrative } from "./commentaryEnrichmentEngine";
import { postProcessCommentaryText } from "./commentaryPostProcessor";
import { getCommentaryIntelligenceByEvent, persistCommentaryIntelligence } from "./commentaryIntelligenceStore";
import { maybeGenerateCommentarySummaries } from "./commentarySummaryEngine";
import { updateMatchStory } from "./commentaryMatchStoryEngine";
import { markCommentaryInferenceFallback } from "./commentaryInferenceClient";
import type {
  CommentaryIntelligenceInput,
  CommentaryIntelligenceMetadata,
  CommentaryIntelligenceResult,
  CommentaryRuntimeMode,
} from "./commentaryIntelligenceContract";

function mapRuntimeMode(event: BallEvent): CommentaryRuntimeMode {
  switch (event.eventSource) {
    case "REPLAY":
      return "replay";
    case "SIMULATION":
      return "simulation";
    case "MOCK_INGESTION":
      return "mock";
    default:
      return "live";
  }
}

async function executeCommentaryPipeline(input: CommentaryIntelligenceInput): Promise<CommentaryIntelligenceResult | null> {
  const { matchId, branchId, event, state } = input;
  if (!event.valid) return null;

  const start = Date.now();
  const context = buildCommentaryContext(matchId, branchId, event);
  if (!context) return null;

  const narrative = evolveCommentaryNarrative(context);
  const situation = classifyCommentarySituation(context);
  const tone = selectCommentaryTone(context, situation);
  const validation = validateCommentaryContext(context);
  const strategy = selectCommentaryGenerationStrategy({ event, context, situation });

  let generated = generateTemplateCommentary({ event, state, context, situation, tone });
  let cacheHit = false;
  let model = "template-v2";
  let generator: CommentaryIntelligenceMetadata["generator"] = "template";

  const retrieval = retrieveSimilarCommentary({
    event,
    context,
    situation,
    narrative,
    tone,
  });

  if (strategy.path === "template+enrich" || strategy.path === "retrieval+ai") {
    const enriched = await enrichCommentaryNarrative({
      baseText: generated,
      retrievedText: strategy.path === "retrieval+ai" ? retrieval.adaptedText : null,
      event,
      context,
      narrative,
      situation,
      tone,
    });
    generated = enriched.text;
    model = enriched.model;
    generator = strategy.path === "retrieval+ai" ? "retrieval" : "hybrid";
    cacheHit = retrieval.cacheHit;
  }

  const post = postProcessCommentaryText({
    text: generated,
    matchId,
    eventId: event.id,
    tone,
    context,
    narrative,
  });

  const fallbackReason = !validation.valid ? "context_validation_failed" : null;
  const usedFallback = !validation.valid || !post.text.trim();

  const finalText = usedFallback
    ? "No significant update on that delivery."
    : post.text;

  if (usedFallback) {
    markCommentaryInferenceFallback();
  }

  const story = updateMatchStory({
    matchId,
    eventId: event.id,
    timestamp: event.timestamp,
    context,
    narrative,
    situation,
  });

  const summaries = maybeGenerateCommentarySummaries({
    matchId,
    event,
    context,
    situation,
    commentaryText: finalText,
  });

  const metadata: CommentaryIntelligenceMetadata = {
    generator: usedFallback ? "fallback" : generator,
    model,
    latencyMs: Date.now() - start,
    cacheHit,
    strategy,
    tone,
    categories: [
      strategy.importance,
      situation.primary ?? "delivery",
      ...summaries.map((summary) => `summary:${summary.summaryType}`),
    ],
    tags: situation.tags,
    narrativeState: narrative.activeNarratives,
    safety: {
      usedFallback,
      fallbackReason,
      blockedTerms: post.blockedTerms,
    },
    runtimeMode: input.runtimeMode,
    createdAt: Date.now(),
    contextSummary: {
      pressureLevel: context.pressureLevel,
      phaseOfMatch: context.phaseOfMatch,
      momentumState: context.momentumState,
      collapseRisk: context.collapseRisk,
    },
    futureReadiness: {
      language: input.language ?? "en",
      voice: {
        ttsReady: true,
        style: tone === "dramatic" || tone === "aggressive" ? "excited" : tone === "analytical" ? "analytical" : "neutral",
      },
      analyst: {
        reasoning: [
          `strategy:${strategy.path}`,
          `pressure:${context.pressureLevel}`,
          `situation:${situation.primary ?? "none"}`,
          `storyline:${story.activeStoryline}`,
        ],
        answerHints: [
          context.chaseNarrative,
          context.inningsNarrative,
          context.partnershipNarrative,
        ],
      },
      highlightSignals: {
        turningPoint: situation.tags.includes("turningPoint"),
        wicketCluster: context.wicketClusterRisk >= 0.6,
        clutchMoment: situation.tags.includes("clutchMoment"),
        momentumShift: situation.tags.includes("momentumReversal"),
      },
    },
  };

  const sequence = getCommentaryContextSnapshots(matchId).length + 1;
  appendCommentaryContextSnapshot({
    matchId,
    branchId,
    eventId: event.id,
    sequence,
    timestamp: event.timestamp,
    source: event.eventSource ?? "MANUAL",
    context,
    narrative,
    situation,
    tone,
    validation,
  });

  const result: CommentaryIntelligenceResult = {
    text: finalText,
    eventId: event.id,
    matchId,
    context,
    narrative,
    situation,
    metadata,
  };

  persistCommentaryIntelligence(result);

  console.log(
    JSON.stringify({
      event: "commentary_generated",
      matchId,
      eventId: event.id,
      strategy: strategy.path,
      importance: strategy.importance,
      fallback: usedFallback,
      latencyMs: metadata.latencyMs,
    }),
  );

  if (strategy.path === "retrieval+ai") {
    console.log(
      JSON.stringify({
        event: "commentary_retrieved",
        matchId,
        eventId: event.id,
        retrievalId: retrieval.retrievalId,
        retrievalConfidence: retrieval.confidence,
      }),
    );

    console.log(
      JSON.stringify({
        event: "commentary_ai_enriched",
        matchId,
        eventId: event.id,
        model,
      }),
    );
  }

  if (usedFallback) {
    console.log(
      JSON.stringify({
        event: "commentary_fallback_used",
        matchId,
        eventId: event.id,
        reason: fallbackReason,
      }),
    );
  }

  if (summaries.length > 0) {
    console.log(
      JSON.stringify({
        event: "commentary_summary_generated",
        matchId,
        eventId: event.id,
        summaryTypes: summaries.map((item) => item.summaryType),
      }),
    );
  }

  return result;
}

export async function generateCommentaryForBall(input: {
  matchId: string;
  branchId: string;
  event: BallEvent;
  state: MatchState;
  events: BallEvent[];
}) {
  try {
    return await executeCommentaryPipeline({
      ...input,
      runtimeMode: mapRuntimeMode(input.event),
      language: "en",
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "commentary_generation_failed",
        matchId: input.matchId,
        eventId: input.event.id,
        error: error instanceof Error ? error.message : "unknown_error",
      }),
    );

    return null;
  }
}

export function runCommentaryOrchestration(matchId: string, branchId: string, event: BallEvent) {
  if (!event.valid) {
    return;
  }
  if (getCommentaryIntelligenceByEvent(matchId, event.id)) {
    return;
  }

  const state = getMatchState(matchId);
  if (!state) return;

  void executeCommentaryPipeline({
    matchId,
    branchId,
    event,
    state,
    events: getEventStream(matchId),
    runtimeMode: mapRuntimeMode(event),
    language: "en",
  });
}
