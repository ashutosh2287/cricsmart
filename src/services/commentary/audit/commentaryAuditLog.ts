import fs from "fs";
import path from "path";

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
};

const byMatch: Record<string, CommentaryAuditEntry[]> = {};

function auditPath(matchId: string): string {
  return path.join(process.cwd(), "ml", "commentary", "datasets", "processed", "context_snapshots", `${matchId}.audit.ndjson`);
}

function safePersist(entry: CommentaryAuditEntry) {
  try {
    const filePath = auditPath(entry.matchId);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf-8");
  } catch {
    // never block commentary runtime on audit persistence errors
  }
}

export function appendCommentaryAudit(entry: CommentaryAuditEntry) {
  if (!byMatch[entry.matchId]) byMatch[entry.matchId] = [];
  byMatch[entry.matchId].push(entry);
  safePersist(entry);
}

export function getCommentaryAudit(matchId: string): CommentaryAuditEntry[] {
  return byMatch[matchId] ?? [];
}
