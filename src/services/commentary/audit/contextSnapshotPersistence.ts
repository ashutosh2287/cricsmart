import type { CommentaryContext, CommentaryEvent, CommentaryPlan, NarrativeState } from "@/services/commentary/types/commentary.types";

type SnapshotRow = {
  timestamp: number;
  matchId: string;
  branchId: string;
  eventId: string;
  sequence: number;
  storageTarget: string;
  narrativeStateSnapshot: NarrativeState;
  pressureState: {
    pressureContext: CommentaryPlan["pressureContext"];
    chaseComplexity: number;
    dotBallStreak: number;
  };
  momentumState: {
    momentumShift: boolean;
    scoringAcceleration: number;
    recentRuns: number;
    recentWickets: number;
  };
  probabilityState: {
    probabilitySwing: number;
  };
  plannerOutput: CommentaryPlan;
  selectedTemplate: string;
  retrievalCandidates: Array<{ id: string; text: string; score: number }>;
  finalCommentary: string;
};

const sequenceByMatch: Record<string, number> = {};
const snapshotsByMatch: Record<string, SnapshotRow[]> = {};

function nextSequence(matchId: string): number {
  sequenceByMatch[matchId] = (sequenceByMatch[matchId] ?? 0) + 1;
  return sequenceByMatch[matchId];
}

function snapshotTarget(matchId: string): string {
  return `ml/commentary/datasets/processed/context_snapshots/${matchId}.ndjson`;
}

export function persistCommentaryContextSnapshot(input: {
  matchId: string;
  branchId: string;
  context: CommentaryContext;
  narrativeState: NarrativeState;
  plan: CommentaryPlan;
  retrievalCandidates: Array<{ id: string; text: string; score: number }>;
  event: CommentaryEvent;
}): void {
  const row: SnapshotRow = {
    timestamp: Date.now(),
    matchId: input.matchId,
    branchId: input.branchId,
    eventId: input.event.eventId,
    sequence: nextSequence(input.matchId),
    storageTarget: snapshotTarget(input.matchId),
    narrativeStateSnapshot: input.narrativeState,
    pressureState: {
      pressureContext: input.plan.pressureContext,
      chaseComplexity: input.context.chaseComplexity,
      dotBallStreak: input.context.dotBallStreak,
    },
    momentumState: {
      momentumShift: input.plan.momentumShift,
      scoringAcceleration: input.context.scoringAcceleration,
      recentRuns: input.context.recentRuns,
      recentWickets: input.context.recentWickets,
    },
    probabilityState: {
      probabilitySwing: input.context.probabilitySwing,
    },
    plannerOutput: input.plan,
    selectedTemplate: input.plan.templateKey,
    retrievalCandidates: input.retrievalCandidates,
    finalCommentary: input.event.text,
  };

  if (!snapshotsByMatch[input.matchId]) snapshotsByMatch[input.matchId] = [];
  snapshotsByMatch[input.matchId].push(row);
}

export function getPersistedCommentaryContextSnapshots(matchId: string): SnapshotRow[] {
  return snapshotsByMatch[matchId] ?? [];
}
