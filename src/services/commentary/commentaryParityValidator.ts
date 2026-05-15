import type { CommentaryContextSnapshot } from "./commentaryContextTypes";
import { getCommentaryContextSnapshots } from "./commentaryContextSnapshotStore";

function stableProjection(snapshot: CommentaryContextSnapshot) {
  return {
    eventId: snapshot.eventId,
    innings: snapshot.context.innings,
    over: snapshot.context.over,
    ball: snapshot.context.ball,
    pressureLevel: snapshot.context.pressureLevel,
    collapseRisk: Number(snapshot.context.collapseRisk.toFixed(3)),
    momentumState: snapshot.context.momentumState,
    tone: snapshot.tone,
    primarySituation: snapshot.situation.primary,
    narratives: snapshot.narrative.activeNarratives,
  };
}

export function buildCommentaryParityFingerprint(matchId: string): string {
  return JSON.stringify(getCommentaryContextSnapshots(matchId).map(stableProjection));
}

export function validateCommentaryParity(matchA: string, matchB: string): {
  equal: boolean;
  reason: string;
} {
  const fpA = buildCommentaryParityFingerprint(matchA);
  const fpB = buildCommentaryParityFingerprint(matchB);

  if (fpA === fpB) {
    return { equal: true, reason: "identical_context_outputs" };
  }

  return { equal: false, reason: "context_output_divergence_detected" };
}
