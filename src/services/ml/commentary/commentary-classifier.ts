import type {
  CommentaryContext,
  CommentaryImportance,
  CommentaryPlan,
  CommentaryTone,
  CommentaryType,
} from "@/services/commentary/types/commentary.types";
import {
  buildRuntimeFeatureMap,
  getExpectedFeatureOrder,
  getRuntimeThresholds,
  normalizeCommentaryTypeLabel,
  normalizeImportanceLabel,
  normalizeToneLabel,
  validateRuntimeContract,
} from "./commentary-runtime-contract";
import { validateCommentaryFeatures } from "./commentary-feature-validator";

export type CommentaryClassifierPrediction = {
  commentaryType: CommentaryType;
  tone: CommentaryTone;
  importance: CommentaryImportance;
  confidence: number;
  reason: string;
};

export type CommentaryClassifierRuntimeResult = {
  prediction: CommentaryClassifierPrediction;
  applied: boolean;
  fallbackReasons: string[];
  latencyMs: number;
};

function computeDeterministicPrediction(context: CommentaryContext): CommentaryClassifierPrediction {
  const wicket = context.eventType === "WICKET";
  const boundary = context.runsThisBall >= 4;

  if (wicket) {
    return {
      commentaryType: normalizeCommentaryTypeLabel("turning_point"),
      tone: normalizeToneLabel("dramatic"),
      importance: normalizeImportanceLabel("high"),
      confidence: 0.9,
      reason: "wicket-turning-point",
    };
  }

  if (context.dotBallStreak >= 3 || context.requiredRunRate - context.currentRunRate >= 2) {
    return {
      commentaryType: normalizeCommentaryTypeLabel("pressure"),
      tone: normalizeToneLabel("tense"),
      importance: normalizeImportanceLabel("medium"),
      confidence: 0.78,
      reason: "pressure-build",
    };
  }

  if (context.currentPartnershipRuns >= 35) {
    return {
      commentaryType: normalizeCommentaryTypeLabel("partnership"),
      tone: normalizeToneLabel("analytical"),
      importance: normalizeImportanceLabel("medium"),
      confidence: 0.74,
      reason: "partnership-context",
    };
  }

  if (boundary) {
    return {
      commentaryType: normalizeCommentaryTypeLabel("boundary"),
      tone: normalizeToneLabel("celebratory"),
      importance: normalizeImportanceLabel("medium"),
      confidence: 0.76,
      reason: "boundary-signal",
    };
  }

  return {
    commentaryType: "ball",
    tone: "neutral",
    importance: "low",
    confidence: 0.61,
    reason: "neutral-fallback",
  };
}

export function runCommentaryClassifier(input: {
  context: CommentaryContext;
  plan: CommentaryPlan;
}): CommentaryClassifierRuntimeResult {
  const start = Date.now();
  const fallbackReasons: string[] = [];
  const thresholds = getRuntimeThresholds();

  const contract = validateRuntimeContract();
  if (!contract.valid) {
    return {
      prediction: {
        commentaryType: input.plan.commentaryType,
        tone: input.plan.tone,
        importance: input.plan.importance,
        confidence: 0,
        reason: "contract_mismatch",
      },
      applied: false,
      fallbackReasons: contract.errors,
      latencyMs: Date.now() - start,
    };
  }

  const featureMap = buildRuntimeFeatureMap(input.context);
  const validation = validateCommentaryFeatures({
    featureMap,
    expectedOrder: getExpectedFeatureOrder("classifier"),
  });

  if (!validation.valid) {
    return {
      prediction: {
        commentaryType: input.plan.commentaryType,
        tone: input.plan.tone,
        importance: input.plan.importance,
        confidence: 0,
        reason: "feature_validation_failed",
      },
      applied: false,
      fallbackReasons: validation.errors,
      latencyMs: Date.now() - start,
    };
  }

  const prediction = computeDeterministicPrediction(input.context);
  const lowConfidence =
    prediction.confidence < thresholds.commentary_type_threshold ||
    prediction.confidence < thresholds.tone_threshold ||
    prediction.confidence < thresholds.importance_threshold;

  if (lowConfidence) {
    fallbackReasons.push("classifier_confidence_below_threshold");
  }

  return {
    prediction: lowConfidence
      ? {
          commentaryType: input.plan.commentaryType,
          tone: input.plan.tone,
          importance: input.plan.importance,
          confidence: prediction.confidence,
          reason: prediction.reason,
        }
      : prediction,
    applied: !lowConfidence,
    fallbackReasons,
    latencyMs: Date.now() - start,
  };
}
