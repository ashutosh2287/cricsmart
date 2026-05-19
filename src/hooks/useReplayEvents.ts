"use client";

import { useEffect, useRef, useState } from "react";
import type { BallEvent } from "@/types/ballEvent";
import type { MatchDomainEvent } from "@/services/match/events/matchEvents";

type UseReplayEventsOptions = {
  runtimeMatchId: string;
  includeHistory?: boolean;
};

type UseReplayEventsResult = {
  events: MatchDomainEvent[];
  connected: boolean;
  error: string | null;
};

function toDomainEvent(runtimeMatchId: string, event: BallEvent, sequence: number): MatchDomainEvent {
  const type = event.type === "WICKET" ? "WICKET" : "BALL";
  return {
    type,
    runtimeMatchId,
    timestamp: event.timestamp ?? Date.now(),
    eventMeta: {
      eventId: event.id ?? `${runtimeMatchId}-${sequence}`,
      sequence,
      timestamp: event.timestamp ?? Date.now(),
      runtimeMatchId,
      innings: event.innings,
      over: Number.isFinite(event.over) ? Math.floor(event.over) : undefined,
      eventType: event.type,
    },
    ballEvent: event,
  };
}

export function useReplayEvents({
  runtimeMatchId,
  includeHistory = true,
}: UseReplayEventsOptions): UseReplayEventsResult {
  const [events, setEvents] = useState<MatchDomainEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!runtimeMatchId) {
      setEvents([]);
      setConnected(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const requestId = ++requestRef.current;

    const loadHistory = async () => {
      try {
        const res = await fetch(
          `/api/events?matchId=${encodeURIComponent(runtimeMatchId)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch replay events (${res.status})`);
        }

        const payload = (await res.json()) as BallEvent[];
        if (cancelled || requestRef.current !== requestId) return;

        const normalized = (Array.isArray(payload) ? payload : []).map((event, index) =>
          toDomainEvent(runtimeMatchId, event, index)
        );
        setEvents(normalized);
        setError(null);
      } catch (err) {
        if (cancelled || requestRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "Failed to fetch replay events");
      }
    };

    setEvents([]);
    setConnected(false);
    setError(null);

    if (includeHistory) {
      void loadHistory();
    }

    if (typeof window === "undefined") {
      return () => {};
    }

    const source = new EventSource(`/api/realtime/${encodeURIComponent(runtimeMatchId)}`);
    sourceRef.current = source;

    const handleRefresh = () => {
      if (!includeHistory) return;
      void loadHistory();
    };

    source.addEventListener("CONNECTED", () => {
      if (cancelled) return;
      setConnected(true);
      setError(null);
    });
    source.addEventListener("BALL_EVENT", handleRefresh);
    source.addEventListener("WICKET", handleRefresh);
    source.addEventListener("MATCH_FINISHED", handleRefresh);
    source.onerror = () => {
      if (cancelled) return;
      setConnected(false);
      setError("Replay stream disconnected");
    };

    return () => {
      cancelled = true;
      source.close();
      sourceRef.current = null;
    };
  }, [runtimeMatchId, includeHistory]);

  return { events, connected, error };
}
