import type { CommentaryContext, CommentaryPlan } from "@/services/commentary/types/commentary.types";
import { getRuntimeThresholds } from "./commentary-runtime-contract";

const TEMPLATE_CANDIDATES = [
  "boundary_pressure_release",
  "collapse_warning",
  "momentum_shift",
  "wicket_turning_point",
  "wicket_breakthrough",
  "dot_ball_pressure",
  "partnership_building",
  "standard_boundary",
  "single_rotation",
  "over_summary_attack",
  "over_summary_tight",
  "over_summary_wicket",
  "pressure_summary",
  "momentum_shift_summary",
  "turning_point_summary",
];

export type CommentaryRankerResult = {
  selectedTemplate: string;
  confidence: number;
  ranked: Array<{ templateKey: string; score: number }>;
  applied: boolean;
  fallbackReasons: string[];
  latencyMs: number;
};

function scoreTemplate(templateKey: string, context: CommentaryContext, plan: CommentaryPlan): number {
  let score = 0;
  if (templateKey === plan.templateKey) score += 4;
  if (context.eventType === "WICKET" && templateKey.includes("wicket")) score += 6;
  if (context.runsThisBall >= 4 && templateKey.includes("boundary")) score += 5;
  if (context.dotBallStreak >= 3 && templateKey.includes("dot_ball")) score += 4;
  if (context.currentPartnershipRuns >= 35 && templateKey.includes("partnership")) score += 4;
  if (context.overPhase === "DEATH_OVERS" && (templateKey.includes("pressure") || templateKey.includes("turning"))) score += 3;
  if (plan.momentumShift && templateKey.includes("momentum")) score += 3;
  return score;
}

export function runCommentaryTemplateRanker(input: {
  context: CommentaryContext;
  plan: CommentaryPlan;
}): CommentaryRankerResult {
  const start = Date.now();
  const thresholds = getRuntimeThresholds();

  const ranked = TEMPLATE_CANDIDATES.map((templateKey) => ({
    templateKey,
    score: scoreTemplate(templateKey, input.context, input.plan),
  })).sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return left.templateKey.localeCompare(right.templateKey);
  });

  const confidence = Math.max(0, Math.min(1, (ranked[0]?.score ?? 0) / 12));
  const applied = confidence >= thresholds.template_rank_threshold;

  return {
    selectedTemplate: applied ? (ranked[0]?.templateKey ?? input.plan.templateKey) : input.plan.templateKey,
    confidence,
    ranked,
    applied,
    fallbackReasons: applied ? [] : ["ranker_confidence_below_threshold"],
    latencyMs: Date.now() - start,
  };
}
