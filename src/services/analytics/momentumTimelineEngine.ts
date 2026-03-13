import { BallEvent } from "@/types/ballEvent";

export type MomentumPoint = {
  ballIndex: number;
  momentum: number;
};

type MomentumState = {
  momentum: number;
  timeline: MomentumPoint[];
};

const momentumTimelineStore: Record<string, MomentumState> = {};

export function initMomentumTimeline(matchId: string) {
  momentumTimelineStore[matchId] = {
    momentum: 0,
    timeline: []
  };
}

export function resetMomentumTimeline(matchId: string) {
  delete momentumTimelineStore[matchId];
}

export function processMomentumEvent(
  matchId: string,
  event: BallEvent,
  ballIndex: number
) {

  let state = momentumTimelineStore[matchId];

  if (!state) {
    initMomentumTimeline(matchId);
    state = momentumTimelineStore[matchId];
  }

  if (!event.valid) return;

  let momentum = state.momentum;

  if (event.wicket) momentum -= 2;

  if (event.type === "FOUR" || event.type === "SIX") {
    momentum += 2;
  }

  if (event.runs === 0 && event.isLegalDelivery) {
    momentum -= 0.5;
  }

  momentum = Math.max(-10, Math.min(10, momentum));

  state.momentum = momentum;

  state.timeline.push({
    ballIndex,
    momentum
  });

}

export function getMomentumTimeline(matchId: string) {
  return momentumTimelineStore[matchId]?.timeline ?? [];
}