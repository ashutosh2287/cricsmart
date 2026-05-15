import type { BallEvent } from "@/types/ballEvent";
import type { MatchState } from "@/services/matchEngine";
import { processCommentaryEvent } from "./commentaryEngine";
import { buildCommentaryContext } from "./commentaryContextBuilder";
import { evolveCommentaryNarrative } from "./commentaryNarrativeEngine";
import { classifyCommentarySituation } from "./commentarySituationClassifier";
import { selectCommentaryTone } from "./commentaryToneEngine";
import { validateCommentaryContext } from "./commentaryContextValidator";
import { appendCommentaryContextSnapshot, getCommentaryContextSnapshots } from "./commentaryContextSnapshotStore";
import { generateAdvancedCommentary } from "./advancedCommentaryEngine";
import type { CommentaryIntelligenceMetadata } from "./commentaryIntelligenceContract";

export function runCommentaryOrchestration(
  matchId: string,
  branchId: string,
  event: BallEvent,
) {
  if (!event.valid) {
    return;
  }

  const context = buildCommentaryContext(matchId, branchId, event);

  if (context) {
    const narrative = evolveCommentaryNarrative(context);
    const situation = classifyCommentarySituation(context);
    const tone = selectCommentaryTone(context, situation);
    const validation = validateCommentaryContext(context);
    const sequence = getCommentaryContextSnapshots(matchId).length + 1;

    appendCommentaryContextSnapshot({
      matchId,
      branchId,
      eventId: event.id,
      sequence,
      timestamp: event.timestamp,
      source: event.eventSource ?? "MANUAL",
      context,
      narrative,
      situation,
      tone,
      validation,
    });
  }

  processCommentaryEvent(matchId, branchId, event);
}

export function generateCommentaryForBall(input: {
  matchId: string;
  branchId: string;
  event: BallEvent;
  state: MatchState;
}): { text: string; metadata?: CommentaryIntelligenceMetadata } {
  const { matchId, branchId, event, state } = input;
  runCommentaryOrchestration(matchId, branchId, event);
  const text = generateAdvancedCommentary(event, state);
  return { text };
}
