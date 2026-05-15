import type { BallEvent } from "@/types/ballEvent";
import type {
  CollapseRisk,
  CommentaryContext,
  CommentaryPlan,
  CommentaryType,
  MomentumState,
  NarrativeState,
  PressureLevel,
} from "../types/commentary.types";

type PlannerInput = {
  ballEvent: BallEvent;
  context: CommentaryContext;
  narrativeState: NarrativeState;
  pressureLevel: PressureLevel;
  momentumState: MomentumState;
  collapseRisk: CollapseRisk;
  turningPointDetected: boolean;
  momentumShift: boolean;
  partnershipStrength: "NEW" | "SETTLING" | "ESTABLISHED" | "DOMINANT";
  commentaryType?: CommentaryType;
};

function basePlan(input: PlannerInput, narrativeType: string, templateKey: string): CommentaryPlan {
  return {
    commentaryType: input.commentaryType ?? "ball",
    narrativeType,
    tone: "neutral",
    importance: "medium",
    focusPlayer: input.context.batter,
    momentumShift: input.momentumShift,
    pressureContext: input.pressureLevel,
    templateKey,
  };
}

export function buildCommentaryPlan(input: PlannerInput): CommentaryPlan {
  const commentaryType = input.commentaryType ?? "ball";

  if (commentaryType === "over-summary") {
    const plan = basePlan(
      input,
      input.context.wicketsInOver > 0 ? "over-pivot" : "over-summary",
      input.context.wicketsInOver > 0 ? "over_summary_wicket" : input.context.recentOverRuns >= 10 ? "over_summary_attack" : "over_summary_tight",
    );
    plan.importance = input.context.wicketsInOver > 0 || input.context.recentOverRuns >= 12 ? "high" : "medium";
    plan.focusPlayer = input.context.bowler;
    return plan;
  }

  if (commentaryType === "pressure-summary") {
    const plan = basePlan(input, "pressure-watch", "pressure_summary");
    plan.importance = input.pressureLevel === "EXTREME" ? "high" : "medium";
    return plan;
  }

  if (commentaryType === "momentum-summary") {
    const plan = basePlan(input, "momentum-watch", "momentum_shift_summary");
    plan.importance = input.momentumShift ? "high" : "medium";
    plan.focusPlayer = input.narrativeState.momentumTeam ?? input.context.batter;
    return plan;
  }

  if (commentaryType === "turning-point") {
    const plan = basePlan(input, "turning-point", "turning_point_summary");
    plan.importance = "high";
    plan.focusPlayer = input.ballEvent.type === "WICKET" ? input.context.bowler : input.context.batter;
    return plan;
  }

  if (input.turningPointDetected && input.ballEvent.type === "WICKET") {
    const plan = basePlan(input, "turning-point-wicket", "wicket_turning_point");
    plan.importance = "high";
    plan.focusPlayer = input.context.bowler;
    return plan;
  }

  if (input.ballEvent.type === "WICKET") {
    const plan = basePlan(
      input,
      input.collapseRisk === "HIGH" ? "collapse-warning" : "breakthrough",
      input.collapseRisk === "HIGH" ? "collapse_warning" : "wicket_breakthrough",
    );
    plan.importance = input.pressureLevel === "HIGH" || input.pressureLevel === "EXTREME" ? "high" : "medium";
    plan.focusPlayer = input.context.bowler;
    return plan;
  }

  if ((input.ballEvent.runs ?? 0) >= 4 && (input.pressureLevel === "HIGH" || input.pressureLevel === "EXTREME")) {
    const plan = basePlan(input, "pressure-release", "boundary_pressure_release");
    plan.importance = "high";
    return plan;
  }

  if (input.momentumShift) {
    const plan = basePlan(input, "momentum-shift", "momentum_shift");
    plan.importance = "high";
    plan.focusPlayer = input.narrativeState.momentumTeam ?? input.context.batter;
    return plan;
  }

  if (input.partnershipStrength === "DOMINANT" || input.partnershipStrength === "ESTABLISHED") {
    const plan = basePlan(input, "partnership-control", "partnership_building");
    plan.importance = input.partnershipStrength === "DOMINANT" ? "high" : "medium";
    return plan;
  }

  if (input.context.dotBallStreak >= 3) {
    const plan = basePlan(input, "pressure-build", "dot_ball_pressure");
    plan.importance = input.pressureLevel === "LOW" ? "medium" : "high";
    plan.focusPlayer = input.context.bowler;
    return plan;
  }

  if ((input.ballEvent.runs ?? 0) >= 4) {
    const plan = basePlan(input, "boundary-flow", "standard_boundary");
    plan.importance = "medium";
    return plan;
  }

  return basePlan(input, "strike-rotation", "single_rotation");
}
