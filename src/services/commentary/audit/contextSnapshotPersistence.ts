import fs from "fs";
import path from "path";
import type { CommentaryContext, CommentaryEvent, CommentaryPlan, NarrativeState } from "@/services/commentary/types/commentary.types";

type SnapshotRow = {
  timestamp: number;
  matchId: string;
  branchId: string;
  eventId: string;
  sequence: number;
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

function nextSequence(matchId: string): number {
  sequenceByMatch[matchId] = (sequenceByMatch[matchId] ?? 0) + 1;
  return sequenceByMatch[matchId];
}

function snapshotPath(matchId: string): string {
  return path.join(process.cwd(), "ml", "commentary", "datasets", "processed", "context_snapshots", `${matchId}.ndjson`);
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

  try {
    const filePath = snapshotPath(input.matchId);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, `${JSON.stringify(row)}\n`, "utf-8");
  } catch {
    // never block deterministic commentary path
  }
}
