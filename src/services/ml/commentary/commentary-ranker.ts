import type { CommentaryContext, CommentaryPlan } from "@/services/commentary/types/commentary.types";

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

export function rankTemplateForContext(input: { context: CommentaryContext; plan: CommentaryPlan }) {
  const { context, plan } = input;
  const ranked = TEMPLATE_CANDIDATES.map((templateKey) => ({
    templateKey,
    score: scoreTemplate(templateKey, context, plan),
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.templateKey.localeCompare(b.templateKey);
  });

  const maxScore = 12;
  const topScore = ranked[0]?.score ?? 0;

  return {
    topTemplateKey: ranked[0]?.templateKey ?? plan.templateKey,
    score: topScore,
    confidence: Math.max(0, Math.min(1, topScore / maxScore)),
    ranked,
  };
}
