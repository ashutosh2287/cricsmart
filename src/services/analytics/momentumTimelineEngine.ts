import { BallEvent } from "@/types/ballEvent";
import { getMomentumSwings } from "./momentumSwingEngine";

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

  /*
  =========================================
  🎯 BASE EVENT IMPACT (IMPROVED)
  =========================================
  */

  if (event.wicket) momentum -= 3;

  if (event.type === "FOUR") momentum += 2.5;

  if (event.type === "SIX") momentum += 3.5;

  if (event.runs === 0 && event.isLegalDelivery) {
    momentum -= 1;
  }

  /*
  =========================================
  🔥 SWING SYNC (IMPORTANT)
  =========================================
  */

  const swings = getMomentumSwings(matchId);

  const swing = swings.find(s => s.ballIndex === ballIndex);

  if (swing) {

    if (swing.type === "BATTING_SURGE") {
      momentum += swing.impact * 4;
    }

    if (swing.type === "BOWLING_STRIKE") {
      momentum -= swing.impact * 4;
    }

    if (swing.type === "MATCH_SHIFT") {
      momentum += swing.impact * 2 * (Math.random() > 0.5 ? 1 : -1);
    }

    if (swing.type === "TURNING_POINT") {
      momentum += swing.impact * 6; // 🔥 BIG spike
    }
  }

  /*
  =========================================
  🔻 SMOOTHING (CRITICAL)
  =========================================
  */

  momentum = momentum * 0.9; // smooth decay

  /*
  =========================================
  📏 CLAMP
  =========================================
  */

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