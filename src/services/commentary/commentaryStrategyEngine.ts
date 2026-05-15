import type { BallEvent } from "@/types/ballEvent";
import type { CommentaryContext, CommentarySituationClassification } from "./commentaryContextTypes";
import type { CommentaryGenerationStrategy } from "./commentaryIntelligenceContract";

function isHighImportance(event: BallEvent, context: CommentaryContext, situation: CommentarySituationClassification) {
  if (event.type === "WICKET" || event.type === "SIX" || event.type === "FOUR") return true;
  if (context.phaseOfMatch === "superOver" || context.phaseOfMatch === "chaseClimax") return true;
  if (context.collapseRisk >= 0.65 || context.clutchIndex >= 70) return true;
  return situation.tags.some((tag) =>
    ["collapse", "turningPoint", "clutchMoment", "momentumReversal", "milestone"].includes(tag),
  );
}

function isMediumImportance(event: BallEvent, context: CommentaryContext, situation: CommentarySituationClassification) {
  if (event.type === "RUN" && (event.runs === 0 || event.runs === 1 || event.runs === 2)) return true;
  if (event.type === "WD" || event.type === "NB") return true;
  if (context.pressureLevel === "high" || context.pressureLevel === "extreme") return true;
  return situation.tags.some((tag) => ["partnership", "recovery", "chasePressure", "deathOvers"].includes(tag));
}

export function selectCommentaryGenerationStrategy(input: {
  event: BallEvent;
  context: CommentaryContext;
  situation: CommentarySituationClassification;
}): CommentaryGenerationStrategy {
  const { event, context, situation } = input;

  if (isHighImportance(event, context, situation)) {
    return {
      importance: "high",
      path: "retrieval+ai",
      reason: "high_impact_delivery_or_clutch_context",
    };
  }

  if (isMediumImportance(event, context, situation)) {
    return {
      importance: "medium",
      path: "template+enrich",
      reason: "contextual_phase_requires_enrichment",
    };
  }

  return {
    importance: "low",
    path: "template",
    reason: "routine_low_impact_delivery",
  };
}
