import { ApiBallEvent } from "../api/cricketApiService";

const buffers: Record<string, ApiBallEvent[]> = {};

export function pushEvents(matchId: string, events: ApiBallEvent[]) {
  if (!buffers[matchId]) buffers[matchId] = [];

  buffers[matchId].push(...events);

  // keep buffer bounded
  if (buffers[matchId].length > 500) {
    buffers[matchId] = buffers[matchId].slice(-300);
  }
}

export function flushEvents(matchId: string): ApiBallEvent[] {
  const events = buffers[matchId] ?? [];
  buffers[matchId] = [];
  return events;
}