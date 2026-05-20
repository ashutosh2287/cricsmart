"use client";

import { useEffect, useMemo, useState } from "react";
import type { BallEvent } from "@/types/ballEvent";

export type ReplayEvent = Record<string, unknown> & {
  type?: string;
  timestamp?: number;
};

type WinProbabilityReplayEvent = {
  type: "WIN_PROBABILITY";
  homeWinPct: number;
  awayWinPct: number;
  over: number;
  ball: number;
  timestamp: number;
};

function isBallLikeEvent(event: ReplayEvent): event is BallEvent {
  return typeof event.type === "string" && event.type !== "WIN_PROBABILITY";
}

function isWinProbabilityEvent(event: ReplayEvent): event is WinProbabilityReplayEvent {
  return event.type === "WIN_PROBABILITY" && typeof event.homeWinPct === "number";
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
        setEvents(Array.isArray(payload) ? (payload as ReplayEvent[]) : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {});

    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const byType = useMemo(() => {
    return (type: string) => events.filter((event) => event.type === type);
  }, [events]);

  return { events, loading: false, byType };
}

export function getWinProbabilityData(events: ReplayEvent[]) {
  return events
    .filter(isWinProbabilityEvent)
    .map((event) => ({
      over: event.over + event.ball / 10,
      value: event.homeWinPct,
      timestamp: event.timestamp,
    }));
}

export function getWormData(events: ReplayEvent[]) {
  let score = 0;
  return events
    .filter(isBallLikeEvent)
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
  for (const event of events.filter(isBallLikeEvent)) {
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
    .filter(isBallLikeEvent)
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