import type { ReplayEvent } from "@/types/replayEvent";

type ReplayEventLike = Partial<ReplayEvent> & {
  type?: unknown;
  timestamp?: unknown;
  innings?: unknown;
  inning?: unknown;
  over?: unknown;
  ball?: unknown;
  payload?: unknown;
  eventMeta?: { sequence?: unknown; timestamp?: unknown; over?: unknown; ball?: unknown; innings?: unknown };
  id?: unknown;
  sequenceNumber?: unknown;
};

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function normalizeReplayEvent(raw: unknown, fallbackIndex = 0): ReplayEvent {
  const candidate = (raw ?? {}) as ReplayEventLike;
  const eventMeta = candidate.eventMeta;
  const sequenceNumber = asNumber(candidate.sequenceNumber, asNumber(eventMeta?.sequence, fallbackIndex));
  const timestamp = asNumber(candidate.timestamp, asNumber(eventMeta?.timestamp, Date.now()));
  const inning = asNumber(candidate.inning, asNumber(candidate.innings, asNumber(eventMeta?.innings, 0)));
  const over = asNumber(candidate.over, asNumber(eventMeta?.over, 0));
  const ball = asNumber(candidate.ball, asNumber(eventMeta?.ball, 0));
  const type = asString(candidate.type, "UNKNOWN");
  const id = asString(
    candidate.id,
    `${sequenceNumber}-${inning}-${over}-${ball}-${type}-${timestamp}`
  );

  return {
    id,
    sequenceNumber,
    type,
    timestamp,
    inning,
    over,
    ball,
    payload: candidate.payload ?? raw,
  };
}

export function dedupeReplayEvents(events: ReplayEvent[]): ReplayEvent[] {
  const map = new Map<string, ReplayEvent>();
  events.forEach((event) => {
    map.set(event.id, event);
  });
  return Array.from(map.values()).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
}

export function mergeReplayEvents(existing: ReplayEvent[], incoming: ReplayEvent[]) {
  return dedupeReplayEvents([...existing, ...incoming]);
}
