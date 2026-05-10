type TimelineEvent = {
  eventId: string;
  sequence: number;
  timestamp: number;
  matchId: string;
  innings: number;
  over: number;
  ball: number;
  eventType: string;
};

const timelineStore: Record<string, TimelineEvent[]> = {};

export function appendEventTimeline(matchId: string, event: TimelineEvent) {
  // In-memory timeline is a replay foundation; persistence can be layered later.
  if (!timelineStore[matchId]) {
    timelineStore[matchId] = [];
  }

  timelineStore[matchId].push(event);
}

export function getEventTimeline(matchId: string): TimelineEvent[] {
  return timelineStore[matchId] ?? [];
}

export function resetEventTimeline(matchId: string) {
  delete timelineStore[matchId];
}
