type CommentaryAuditEntry = {
  timestamp: number;
  matchId: string;
  branchId: string;
  eventId: string;
  source?: string;
  modelDecisions: Record<string, unknown>;
  confidenceScores: Record<string, number>;
  latencyMs?: Record<string, number>;
  retrievalMatches: Array<{ id: string; score: number; text: string }>;
  retrievalFilters?: Record<string, unknown>;
  selectedTemplate: string;
  fallbackTriggers: string[];
  schemaHash?: string | null;
  schemaVersion?: string | null;
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

export function getLatestCommentaryAudit(matchId?: string): CommentaryAuditEntry | null {
  if (matchId) {
    const entries = byMatch[matchId] ?? [];
    return entries.length ? entries[entries.length - 1] : null;
  }

  const all = Object.values(byMatch).flat();
  if (!all.length) return null;
  return all[all.length - 1] ?? null;
}

export function getCommentaryMlAuditDiagnostics(matchId?: string) {
  const entries = matchId ? (byMatch[matchId] ?? []) : Object.values(byMatch).flat();
  const latest = entries.length ? entries[entries.length - 1] : null;

  const averageLatencyMs = entries.length
    ? entries.reduce(
        (acc, entry) => {
          acc.classifier += entry.latencyMs?.classifier ?? 0;
          acc.ranker += entry.latencyMs?.ranker ?? 0;
          acc.retrieval += entry.latencyMs?.retrieval ?? 0;
          return acc;
        },
        { classifier: 0, ranker: 0, retrieval: 0 },
      )
    : { classifier: 0, ranker: 0, retrieval: 0 };

  if (entries.length > 0) {
    averageLatencyMs.classifier /= entries.length;
    averageLatencyMs.ranker /= entries.length;
    averageLatencyMs.retrieval /= entries.length;
  }

  return {
    count: entries.length,
    averageLatencyMs,
    fallbackCount: entries.filter((entry) => entry.fallbackTriggers.length > 0).length,
    latest,
  };
}
