"use client";

import { useEffect, useState } from "react";

export type CommentaryFeedEvent = {
  type: "COMMENTARY";
  runtimeMatchId: string;
  commentaryId: string;
  over: number;
  ball: number;
  text: string;
  tone?: string;
  importance?: string;
  isBoundary?: boolean;
  isWicket?: boolean;
  timestamp: number;
};

type ReplayEvent = Record<string, unknown>;

function isCommentaryEvent(event: ReplayEvent): event is CommentaryFeedEvent {
  return (
    event?.type === "COMMENTARY" &&
    typeof event.runtimeMatchId === "string" &&
    typeof event.commentaryId === "string" &&
    typeof event.text === "string" &&
    typeof event.timestamp === "number"
  );
}

function upsertCommentary(
  previous: CommentaryFeedEvent[],
  next: CommentaryFeedEvent
): CommentaryFeedEvent[] {
  if (previous.some((entry) => entry.commentaryId === next.commentaryId)) {
    return previous;
  }
  return [next, ...previous];
}

export function useCommentary(matchId?: string) {
  const [commentary, setCommentary] = useState<CommentaryFeedEvent[]>([]);

  useEffect(() => {
    if (!matchId) return;

    let cancelled = false;

    fetch(`/api/events?matchId=${encodeURIComponent(matchId)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((payload: unknown) => {
        if (cancelled) return;
        const parsed = Array.isArray(payload)
          ? payload.filter(isCommentaryEvent).sort((a, b) => b.timestamp - a.timestamp)
          : [];
        setCommentary(parsed);
      })
      .catch(() => {
        if (!cancelled) {
          setCommentary([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  useEffect(() => {
    if (!matchId || typeof window === "undefined") return;

    const handleRealtimeUpdate = (event: Event) => {
      const custom = event as CustomEvent<Record<string, unknown>>;
      const detail = custom.detail;
      if (!detail || detail.type !== "COMMENTARY") return;
      if (detail.runtimeMatchId !== matchId) return;
      if (!isCommentaryEvent(detail)) return;
      setCommentary((previous) => upsertCommentary(previous, detail));
    };

    window.addEventListener("CRIC_UPDATE", handleRealtimeUpdate);
    return () => window.removeEventListener("CRIC_UPDATE", handleRealtimeUpdate);
  }, [matchId]);

  return matchId ? commentary : [];
}
