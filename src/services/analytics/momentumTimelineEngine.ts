import { getEventStream } from "../matchEngine";

export type MomentumPoint = {
  ballIndex: number;
  momentum: number;
};

const momentumTimelineStore: Record<string, MomentumPoint[]> = {};

export function getMomentumTimeline(matchId: string) {
  return momentumTimelineStore[matchId] ?? [];
}

export function updateMomentumTimeline(matchId: string) {

  const events = getEventStream(matchId);
  if (!events.length) return;

  const timeline: MomentumPoint[] = [];

  let momentum = 0;

  events.forEach((e, index) => {

    if (!e.valid) return;

    if (e.wicket) momentum -= 2;

    if (e.type === "FOUR" || e.type === "SIX") {
      momentum += 2;
    }

    if (e.runs === 0 && e.isLegalDelivery) {
      momentum -= 0.5;
    }

    momentum = Math.max(-10, Math.min(10, momentum));

    timeline.push({
      ballIndex: index,
      momentum
    });

  });

  momentumTimelineStore[matchId] = timeline;
}