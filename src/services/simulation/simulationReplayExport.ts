import type { BallEvent } from "@/types/ballEvent";
import type { SessionSourceType } from "@/types/liveSession";

type ExportStore = {
  events: BallEvent[];
  updatedAt: number;
  sourceType: SessionSourceType;
  provider?: string;
};

const replayExports = new Map<string, ExportStore>();

export function appendReplayEvent(matchId: string, event: BallEvent) {
  const existing = replayExports.get(matchId) ?? {
    events: [],
    updatedAt: Date.now(),
    sourceType: "SIMULATION" as const,
    provider: event.providerType,
  };
  existing.events.push(event);
  existing.updatedAt = Date.now();
  existing.provider = existing.provider ?? event.providerType;
  replayExports.set(matchId, existing);
}

export function getReplayExport(matchId: string) {
  return (
    replayExports.get(matchId) ?? {
      events: [],
      updatedAt: Date.now(),
      sourceType: "SIMULATION" as const,
    }
  );
}

export function clearReplayExport(matchId: string) {
  replayExports.delete(matchId);
}
