type CommentaryAuditEntry = {
  timestamp: number;
  matchId: string;
  branchId: string;
  eventId: string;
  modelDecisions: Record<string, unknown>;
  confidenceScores: Record<string, number>;
  retrievalMatches: Array<{ id: string; score: number; text: string }>;
  selectedTemplate: string;
  fallbackTriggers: string[];
  storageTarget?: string;
};

const byMatch: Record<string, CommentaryAuditEntry[]> = {};
const STORAGE_TARGET = "ml/commentary/datasets/processed/context_snapshots/<matchId>.audit.ndjson";

export function appendCommentaryAudit(entry: CommentaryAuditEntry) {
  const enriched: CommentaryAuditEntry = {
    ...entry,
    storageTarget: STORAGE_TARGET.replace("<matchId>", entry.matchId),
  };

  if (!byMatch[entry.matchId]) byMatch[entry.matchId] = [];
  byMatch[entry.matchId].push(enriched);
}

export function getCommentaryAudit(matchId: string): CommentaryAuditEntry[] {
  return byMatch[matchId] ?? [];
}
