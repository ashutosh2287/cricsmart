import type { BallEvent } from "@/types/ballEvent";

type ExportStore = {
  events: BallEvent[];
  updatedAt: number;
};

const replayExports = new Map<string, ExportStore>();

export function appendReplayEvent(matchId: string, event: BallEvent) {
  const existing = replayExports.get(matchId) ?? { events: [], updatedAt: Date.now() };
  existing.events.push(event);
  existing.updatedAt = Date.now();
  replayExports.set(matchId, existing);
}

export function getReplayExport(matchId: string) {
  return replayExports.get(matchId) ?? { events: [], updatedAt: Date.now() };
}

export function clearReplayExport(matchId: string) {
  replayExports.delete(matchId);
}
