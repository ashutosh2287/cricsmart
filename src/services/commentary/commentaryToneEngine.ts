import type { BallEvent } from "@/types/ballEvent";
import type { CommentaryContextSignals, CommentaryToneType } from "@/types/commentary";

export function resolveCommentaryTone(
  event: BallEvent,
  context: CommentaryContextSignals
): CommentaryToneType {
  if (event.wicket) {
    return context.collapseRisk === "high" ? "dramatic" : "tense";
  }

  if (event.runs === 4 || event.runs === 6) {
    if (context.pressureState === "high") return "dramatic";
    if (context.batterForm === "hot") return "celebratory";
    return "aggressive";
  }

  if (context.pressureState === "high" || context.chaseDifficulty === "extreme") {
    return "tense";
  }

  if (context.momentumState === "collapse") {
    return "analytical";
  }

  return "calm";
}
