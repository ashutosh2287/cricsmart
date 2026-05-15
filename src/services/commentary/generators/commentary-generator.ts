import type { BallEvent } from "@/types/ballEvent";
import { generateTemplateCommentary } from "./template-generator";
import type {
  CommentaryContext,
  CommentaryEvent,
  CommentaryPlan,
  NarrativeState,
} from "../types/commentary.types";

export function generateCommentaryEvent(input: {
  matchId: string;
  ballEvent: BallEvent;
  context: CommentaryContext;
  plan: CommentaryPlan;
  narrativeState: NarrativeState;
}): CommentaryEvent {
  const text = generateTemplateCommentary({
    ballEvent: input.ballEvent,
    context: input.context,
    plan: input.plan,
    momentumTeam: input.narrativeState.momentumTeam,
  });

  return {
    type: "commentary.generated",
    matchId: input.matchId,
    eventId: `${input.ballEvent.id}:${input.plan.commentaryType}`,
    commentaryType: input.plan.commentaryType,
    narrativeType: input.plan.narrativeType,
    text,
    tone: input.plan.tone,
    importance: input.plan.importance,
    over: input.context.over,
    ball: input.context.ball,
    innings: input.context.innings,
    timestamp: input.ballEvent.timestamp,
    focusPlayer: input.plan.focusPlayer,
    templateKey: input.plan.templateKey,
  };
}
