import type { BallEvent } from "@/types/ballEvent";
import type {
  CommentaryContext,
  CommentaryPlan,
  CommentaryTone,
  MomentumState,
  NarrativeState,
  PressureLevel,
} from "../types/commentary.types";

type ToneInput = {
  ballEvent: BallEvent;
  context: CommentaryContext;
  narrativeState: NarrativeState;
  plan: CommentaryPlan;
  pressureLevel: PressureLevel;
  momentumState: MomentumState;
  turningPointDetected: boolean;
};

export function determineTone(input: ToneInput): CommentaryTone {
  if (input.plan.commentaryType === "over-summary") {
    return input.context.wicketsInOver > 0 ? "analytical" : input.context.recentOverRuns >= 10 ? "energetic" : "neutral";
  }

  if (input.turningPointDetected) return "dramatic";
  if (input.ballEvent.type === "WICKET") return input.pressureLevel === "HIGH" || input.pressureLevel === "EXTREME" ? "dramatic" : "tense";
  if ((input.ballEvent.runs ?? 0) >= 4) return input.pressureLevel === "HIGH" || input.pressureLevel === "EXTREME" ? "celebratory" : "energetic";
  if (input.pressureLevel === "EXTREME" || input.narrativeState.dotBallPressure >= 4) return "tense";
  if (input.momentumState === "BOWLING") return "analytical";
  return "neutral";
}
