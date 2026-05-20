"use client";

import { useEffect, useMemo, useState } from "react";
import type { BallEvent } from "@/types/ballEvent";
import type { ReplayEvent } from "@/types/replayEvent";
import {
  dedupeReplayEvents,
  mergeReplayEvents,
  normalizeReplayEvent,
} from "@/services/replay/replayEventUtils";

type WinProbabilityReplayEvent = {
  type: "WIN_PROBABILITY";
  homeWinPct: number;
  awayWinPct: number;
  over: number;
  ball: number;
  timestamp: number;
};

function isBallLikeEvent(event: ReplayEvent): event is BallEvent {
  return event.type !== "WIN_PROBABILITY";
}

function isWinProbabilityEvent(event: ReplayEvent): event is WinProbabilityReplayEvent {
  if (event.type !== "WIN_PROBABILITY") return false;
  const payload = event.payload as Partial<WinProbabilityReplayEvent> | undefined;
  return typeof payload?.homeWinPct === "number";
}

function getBallEventPayload(event: ReplayEvent): BallEvent | null {
  if (!isBallLikeEvent(event)) return null;
  const payload = event.payload as BallEvent | undefined;
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.type !== "string") return null;
  return payload;
}

export function useReplayEvents(matchId?: string) {
  const [events, setEvents] = useState<ReplayEvent[]>([]);

  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;

    fetch(`/api/events?matchId=${encodeURIComponent(matchId)}`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : []))
      .then((payload: unknown) => {
        if (cancelled) return;
        const incoming = Array.isArray(payload)
          ? payload.map((event, index) => normalizeReplayEvent(event, index + 1))
          : [];
        setEvents((prev) => mergeReplayEvents(prev, incoming));
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {});

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const normalizedEvents = useMemo(() => dedupeReplayEvents(events), [events]);

  const byType = useMemo(() => {
    return (type: string) => normalizedEvents.filter((event) => event.type === type);
  }, [normalizedEvents]);

  return { events: normalizedEvents, loading: false, byType };
}

export function getWinProbabilityData(events: ReplayEvent[]) {
  return events
    .filter(isWinProbabilityEvent)
    .map((event) => event.payload as WinProbabilityReplayEvent)
    .map((event) => ({
      over: event.over + event.ball / 10,
      value: event.homeWinPct,
      timestamp: event.timestamp,
    }));
}

export function getWormData(events: ReplayEvent[]) {
  let score = 0;
  return events
    .map(getBallEventPayload)
    .filter((event): event is BallEvent => Boolean(event))
    .filter((event) => typeof event.over === "number" && typeof event.runs === "number")
    .map((event) => {
      score += Number(event.runs ?? 0);
      return {
        over: Number(event.over),
        score,
      };
    });
}

export function getMomentumData(events: ReplayEvent[]) {
  const points: Array<{ over: number; score: number }> = [];
  let momentum = 0;
  for (const event of events.map(getBallEventPayload).filter((e): e is BallEvent => Boolean(e))) {
    const over = typeof event.over === "number" ? event.over : 0;
    const runs = typeof event.runs === "number" ? event.runs : 0;
    const wicket = event.type === "WICKET" ? 1 : 0;
    momentum = Math.max(-10, Math.min(10, momentum * 0.85 + runs * 0.8 - wicket * 2.5));
    points.push({ over, score: momentum });
  }
  return points;
}

export function getRunRateData(events: ReplayEvent[]) {
  let runs = 0;
  let legalBalls = 0;
  return events
    .map(getBallEventPayload)
    .filter((event): event is BallEvent => Boolean(event))
    .map((event) => {
      runs += typeof event.runs === "number" ? event.runs : 0;
      if (event.isLegalDelivery !== false) {
        legalBalls += 1;
      }
      const over = legalBalls / 6;
      return {
        over,
        runRate: legalBalls > 0 ? (runs * 6) / legalBalls : 0,
      };
    });
}
