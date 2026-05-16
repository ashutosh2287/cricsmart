import type { CommentaryContextSnapshot } from "./commentaryContextTypes";
import { getCommentaryContextSnapshots } from "./commentaryContextSnapshotStore";
import { getCommentaryAudit } from "./audit/commentaryAuditLog";

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
  const audit = getCommentaryAudit(matchId);
  if (audit.length > 0) {
    return JSON.stringify(
      audit.map((entry) => ({
        eventId: entry.eventId,
        selectedTemplate: entry.selectedTemplate,
        commentaryType: entry.modelDecisions.finalCommentaryType,
        classifier: Number((entry.confidenceScores.classifier ?? 0).toFixed(4)),
        retrieval: (entry.retrievalMatches ?? []).map((candidate) => ({
          id: candidate.id,
          score: Number(candidate.score.toFixed(4)),
        })),
        fallbackTriggers: [...entry.fallbackTriggers].sort(),
      })),
    );
  }

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
