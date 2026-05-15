import type {
  CommentaryContext,
  CommentaryContextValidation,
} from "./commentaryContextTypes";

const MOMENTUM_STATES = new Set(["surging", "stable", "stalling", "collapsing"]);

export function validateCommentaryContext(context: CommentaryContext): CommentaryContextValidation {
  const errors: string[] = [];

  if (!Number.isFinite(context.over) || context.over < 0) {
    errors.push("invalid_over_value");
  }

  if (!Number.isFinite(context.ball) || context.ball < 0 || context.ball > 5) {
    errors.push("invalid_ball_value");
  }

  if (!Number.isFinite(context.innings) || context.innings < 1 || context.innings > 4) {
    errors.push("innings_mismatch");
  }

  if (context.innings >= 2 && context.target === null) {
    errors.push("missing_target_for_chase");
  }

  if (context.requiredAcceleration < 0 || !Number.isFinite(context.requiredAcceleration)) {
    errors.push("invalid_required_acceleration");
  }

  if (!Number.isFinite(context.collapseRisk) || context.collapseRisk < 0 || context.collapseRisk > 1) {
    errors.push("invalid_collapse_risk");
  }

  if (!MOMENTUM_STATES.has(context.momentumState)) {
    errors.push("invalid_momentum_state");
  }

  if (!Number.isFinite(context.currentRunRate) || context.currentRunRate < 0) {
    errors.push("invalid_current_run_rate");
  }

  if (!Number.isFinite(context.requiredRunRate) || context.requiredRunRate < 0) {
    errors.push("invalid_required_run_rate");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
