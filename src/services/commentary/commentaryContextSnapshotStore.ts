import type {
  CommentaryContextSnapshot,
  CommentaryNarrativeState,
  CommentarySituationClassification,
  CommentaryToneTag,
} from "./commentaryContextTypes";

const snapshotsByMatch: Record<string, CommentaryContextSnapshot[]> = {};
const dedupe: Record<string, Set<string>> = {};
const latestByMatch: Record<string, CommentaryContextSnapshot> = {};

function dedupeKey(matchId: string, branchId: string, eventId: string) {
  return `${matchId}:${branchId}:${eventId}`;
}

export function appendCommentaryContextSnapshot(snapshot: CommentaryContextSnapshot) {
  if (!snapshotsByMatch[snapshot.matchId]) snapshotsByMatch[snapshot.matchId] = [];
  if (!dedupe[snapshot.matchId]) dedupe[snapshot.matchId] = new Set();

  const key = dedupeKey(snapshot.matchId, snapshot.branchId, snapshot.eventId);
  if (dedupe[snapshot.matchId].has(key)) return;

  dedupe[snapshot.matchId].add(key);
  snapshotsByMatch[snapshot.matchId].push(snapshot);
  latestByMatch[snapshot.matchId] = snapshot;
}

export function getCommentaryContextSnapshots(matchId: string): CommentaryContextSnapshot[] {
  return snapshotsByMatch[matchId] ?? [];
}

export function getLatestCommentaryContextSnapshot(matchId: string): CommentaryContextSnapshot | null {
  return latestByMatch[matchId] ?? null;
}

export function getCommentaryContextDiagnostics(matchId?: string): {
  matches: string[];
  totalSnapshots: number;
  contexts: Array<{
    matchId: string;
    eventId: string;
    pressureLevel: string;
    collapseRisk: number;
    momentumState: string;
    tone: CommentaryToneTag;
    situation: CommentarySituationClassification;
    narratives: CommentaryNarrativeState;
  }>;
} {
  const matchIds = matchId ? [matchId] : Object.keys(latestByMatch);

  const contexts = matchIds
    .map((id) => latestByMatch[id])
    .filter((item): item is CommentaryContextSnapshot => Boolean(item))
    .map((snapshot) => ({
      matchId: snapshot.matchId,
      eventId: snapshot.eventId,
      pressureLevel: snapshot.context.pressureLevel,
      collapseRisk: snapshot.context.collapseRisk,
      momentumState: snapshot.context.momentumState,
      tone: snapshot.tone,
      situation: snapshot.situation,
      narratives: snapshot.narrative,
    }));

  return {
    matches: matchIds,
    totalSnapshots: matchIds.reduce((sum, id) => sum + (snapshotsByMatch[id]?.length ?? 0), 0),
    contexts,
  };
}

export function resetCommentaryContextSnapshots(matchId: string) {
  delete snapshotsByMatch[matchId];
  delete dedupe[matchId];
  delete latestByMatch[matchId];
}
