import type { CommentaryIntelligenceMetadata } from "./commentaryIntelligenceContract";

export type CommentaryTimelineItem = {
  matchId: string;
  eventId: string;
  sequence: number;
  timestamp: number;
  text: string;
  source: "ENGINE" | "PROVIDER";
  metadata?: CommentaryIntelligenceMetadata;
};

const timelineStore: Record<string, CommentaryTimelineItem[]> = {};
const dedupeStore: Record<string, Set<string>> = {};

function getDedupeKey(item: CommentaryTimelineItem) {
  return `${item.eventId}:${item.text}:${item.metadata?.strategy.path ?? "none"}`;
}

export function appendCommentaryTimeline(item: CommentaryTimelineItem) {
  if (!timelineStore[item.matchId]) {
    timelineStore[item.matchId] = [];
  }
  if (!dedupeStore[item.matchId]) {
    dedupeStore[item.matchId] = new Set();
  }

  const dedupeKey = getDedupeKey(item);
  if (dedupeStore[item.matchId].has(dedupeKey)) {
    return;
  }

  dedupeStore[item.matchId].add(dedupeKey);
  timelineStore[item.matchId].push(item);
}

export function getCommentaryTimeline(matchId: string) {
  return timelineStore[matchId] ?? [];
}

export function resetCommentaryTimeline(matchId: string) {
  delete timelineStore[matchId];
  delete dedupeStore[matchId];
}
