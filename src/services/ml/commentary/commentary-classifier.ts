import type {
  CommentaryContext,
  CommentaryImportance,
  CommentaryTone,
  CommentaryType,
  PressureLevel,
} from "@/services/commentary/types/commentary.types";

export type CommentaryClassifierPrediction = {
  commentaryType: CommentaryType;
  tone: CommentaryTone;
  importance: CommentaryImportance;
  confidence: number;
  reason: string;
};

function normalizePressure(pressure: PressureLevel): number {
  if (pressure === "EXTREME") return 1.0;
  if (pressure === "HIGH") return 0.8;
  if (pressure === "MEDIUM") return 0.5;
  return 0.2;
}

export function predictCommentaryContext(input: { context: CommentaryContext }): CommentaryClassifierPrediction {
  const { context } = input;
  const pressure = normalizePressure(context.overPhase === "DEATH_OVERS" ? "HIGH" : "MEDIUM");
  const wicket = context.eventType === "WICKET";
  const boundary = context.runsThisBall >= 4;

  if (wicket) {
    return {
      commentaryType: "ball",
      tone: "dramatic",
      importance: pressure >= 0.8 ? "high" : "medium",
      confidence: 0.88,
      reason: "wicket-signal",
    };
  }

  if (boundary && pressure >= 0.8) {
    return {
      commentaryType: "ball",
      tone: "celebratory",
      importance: "high",
      confidence: 0.82,
      reason: "boundary-under-pressure",
    };
  }

  if (context.dotBallStreak >= 3 || context.requiredRunRate - context.currentRunRate >= 2.0) {
    return {
      commentaryType: "pressure-summary",
      tone: "tense",
      importance: "medium",
      confidence: 0.76,
      reason: "pressure-building",
    };
  }

  if (context.currentPartnershipRuns >= 35) {
    return {
      commentaryType: "ball",
      tone: "analytical",
      importance: "medium",
      confidence: 0.72,
      reason: "partnership-context",
    };
  }

  return {
    commentaryType: "ball",
    tone: "neutral",
    importance: "low",
    confidence: 0.62,
    reason: "fallback",
  };
}

