import type { BallEvent } from "@/types/ballEvent";
import type { SessionSourceType } from "@/types/liveSession";

export type RecordingFormat = "json" | "ndjson" | "parquet-ready";

export type RecordingEvent = {
  matchId: string;
  sequence: number;
  recordedAt: number;
  event: BallEvent;
};

export type RecordingMetadata = {
  matchId: string;
  sourceType: SessionSourceType;
  provider?: string;
  seed?: string;
  version: string;
  featureSchemaVersion?: string;
  createdAt: number;
  updatedAt: number;
};

export type RecordingSession = {
  metadata: RecordingMetadata;
  events: RecordingEvent[];
};

const recordingSessions = new Map<string, RecordingSession>();

function ensureSession(matchId: string): RecordingSession {
  const existing = recordingSessions.get(matchId);
  if (existing) return existing;

  const now = Date.now();
  const created: RecordingSession = {
    metadata: {
      matchId,
      sourceType: "SIMULATION",
      version: "v1",
      featureSchemaVersion: "win-probability.v1",
      createdAt: now,
      updatedAt: now,
    },
    events: [],
  };
  recordingSessions.set(matchId, created);
  return created;
}

export function patchRecordingMetadata(
  matchId: string,
  patch: Partial<Omit<RecordingMetadata, "matchId" | "createdAt">>
) {
  const session = ensureSession(matchId);
  session.metadata = {
    ...session.metadata,
    ...patch,
    matchId,
    createdAt: session.metadata.createdAt,
    updatedAt: Date.now(),
  };
}

export function appendRecordingEvent(matchId: string, event: BallEvent): RecordingEvent {
  const session = ensureSession(matchId);
  const nextEvent: RecordingEvent = {
    matchId,
    sequence: session.events.length + 1,
    recordedAt: Date.now(),
    event,
  };
  session.events.push(nextEvent);
  session.metadata.updatedAt = nextEvent.recordedAt;
  return nextEvent;
}

export function getRecordingSession(matchId: string): RecordingSession | null {
  return recordingSessions.get(matchId) ?? null;
}

export function listRecordingSessions(): RecordingSession[] {
  return Array.from(recordingSessions.values());
}

export function clearRecordingSession(matchId: string) {
  recordingSessions.delete(matchId);
}
