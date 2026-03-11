import { getHighlights } from "../highlights/highlightStore";
import { getEventStream } from "../matchEngine";

export type TimelineEvent = {
  id: string;
  type: string;
  eventId: string;
  ballIndex: number;
};

const timelineCache: Record<string, TimelineEvent[]> = {};

export function rebuildMatchTimeline(matchId: string) {

  const highlights = getHighlights(matchId);
  const events = getEventStream(matchId);

  const timeline: TimelineEvent[] = [];

  for (const h of highlights) {

    const index = events.findIndex(e => e.id === h.event.id);

    timeline.push({
      id: h.id,
      type: h.type,
      eventId: h.event.id,
      ballIndex: index >= 0 ? index : 0
    });

  }

  timeline.sort((a, b) => a.ballIndex - b.ballIndex);

  timelineCache[matchId] = timeline;

}

export function getMatchTimeline(matchId: string) {
  return timelineCache[matchId] ?? [];
}