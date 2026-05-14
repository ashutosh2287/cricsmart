import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";
import type { CommentaryContextSignals } from "@/types/commentary";
import { generateAdvancedCommentary } from "@/services/commentary/advancedCommentaryEngine";

function dotBallTemplate(context: CommentaryContextSignals) {
  if (context.pressureState === "high") {
    return "Dot ball. The pressure keeps climbing.";
  }
  return "Dot ball. Tight control from the bowling side.";
}

function runTemplate(event: BallEvent) {
  if (event.runs === 1) return "Single taken.";
  if (event.runs === 2) return "Good running for a couple.";
  if (event.runs === 3) return "Excellent running, they come back for three.";
  return `${event.runs} runs taken.`;
}

export function generateTemplateCommentary(input: {
  event: BallEvent;
  state: MatchState;
  context: CommentaryContextSignals;
}) {
  const { event, state, context } = input;

  if (event.type === "WD") {
    return "Wide called. Extra run to the batting side.";
  }

  if (event.type === "NB") {
    return "No-ball signaled. Free run and pressure on the bowler.";
  }

  if (event.type === "RUN" && event.runs <= 3) {
    if (event.runs === 0) {
      return dotBallTemplate(context);
    }
    return runTemplate(event);
  }

  return generateAdvancedCommentary(event, state);
}
