import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";
import type {
  CommentaryGenerationResult,
  CommentaryInputSchema,
  CommentaryMode,
  CommentaryTag,
} from "@/types/commentary";
import { buildCommentaryContext } from "@/services/commentary/commentaryContextBuilder";
import { resolveCommentaryTone } from "@/services/commentary/commentaryToneEngine";
import { generateTemplateCommentary } from "@/services/commentary/commentaryTemplateEngine";
import {
  enrichCommentary,
  markCommentaryInferenceFallback,
} from "@/services/commentary/commentaryInferenceClient";
import { postProcessCommentaryText } from "@/services/commentary/commentaryPostProcessor";

type GenerateCommentaryInput = {
  matchId: string;
  branchId: string;
  event: BallEvent;
  state: MatchState;
  events: BallEvent[];
  mode?: CommentaryMode;
};

function toMode(event: BallEvent, explicitMode?: CommentaryMode): CommentaryMode {
  if (explicitMode) return explicitMode;
  if (event.eventSource === "REPLAY") return "REPLAY";
  if (event.eventSource === "SIMULATION") return "SIMULATION";
  if (event.eventSource === "MOCK_INGESTION") return "MOCK";
  return "LIVE";
}

function toTags(input: {
  tone: CommentaryGenerationResult["metadata"]["tone"];
  categories: CommentaryGenerationResult["metadata"]["categories"];
  pressureIndex: number;
}) {
  const tags = new Set<CommentaryTag>();
  tags.add(input.tone);
  if (input.categories.includes("collapse")) tags.add("collapse");
  if (input.categories.includes("milestone")) tags.add("milestone");
  if (input.categories.includes("partnership")) tags.add("partnership");
  if (input.pressureIndex >= 55) tags.add("chase_pressure");
  return Array.from(tags);
}

export function generateCommentaryForBall(input: GenerateCommentaryInput): CommentaryGenerationResult {
  const start = Date.now();
  const mode = toMode(input.event, input.mode);
  const context = buildCommentaryContext({
    matchId: input.matchId,
    branchId: input.branchId,
    mode,
    event: input.event,
    state: input.state,
    events: input.events,
  });

  const tone = resolveCommentaryTone(input.event, context);
  const baseText = generateTemplateCommentary({
    event: input.event,
    state: input.state,
    context,
  });

  const cacheKey = [
    input.matchId,
    input.event.id,
    input.event.type,
    tone,
    context.pressureState,
    context.momentumState,
  ].join(":");

  let model = "hybrid-template-v1";
  let cacheHit = false;
  let usedFallback = false;
  let text = baseText;
  let generator: CommentaryGenerationResult["metadata"]["generator"] = "template";

  try {
    const enriched = enrichCommentary({
      baseText,
      tone,
      context,
      cacheKey,
    });

    if (enriched?.text) {
      text = enriched.text;
      model = enriched.model;
      cacheHit = enriched.cacheHit;
      generator = "hybrid";
    }
  } catch {
    usedFallback = true;
    generator = "fallback";
    markCommentaryInferenceFallback();
  }

  if (!text) {
    usedFallback = true;
    generator = "fallback";
    markCommentaryInferenceFallback();
    text = "No significant update on that delivery.";
  }

  const categories = context.situationSignals;
  const inputSchema: CommentaryInputSchema = {
    matchId: input.matchId,
    branchId: input.branchId,
    mode,
    event: input.event,
    source: input.event.eventSource ?? "MANUAL",
    innings: input.state.currentInningsIndex + 1,
    over: input.event.over,
    ball: input.state.innings[input.state.currentInningsIndex]?.ball ?? 0,
    context,
  };

  return {
    text: postProcessCommentaryText(text),
    input: inputSchema,
    metadata: {
      generator,
      model,
      latencyMs: Date.now() - start,
      cacheHit,
      usedFallback,
      tone,
      categories,
      tags: toTags({
        tone,
        categories,
        pressureIndex: context.pressureIndex,
      }),
      createdAt: Date.now(),
    },
  };
}
