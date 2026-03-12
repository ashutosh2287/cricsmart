import { getEventStream } from "../matchEngine";
import { detectTurningPoints } from "../analytics/turningPointEngine";
import { getMomentumSwings } from "../analytics/momentumSwingEngine";

export type ReplaySegment = {
  ballIndex: number;
  type:
    | "WICKET_REPLAY"
    | "BOUNDARY_REPLAY"
    | "MOMENTUM_SHIFT"
    | "TURNING_POINT";
  priority: number;
};

const replayQueue: Record<string, ReplaySegment[]> = {};

export function getReplayQueue(matchId: string) {
  return replayQueue[matchId] ?? [];
}

export function generateReplaySequence(matchId: string) {

  const events = getEventStream(matchId);
  if (!events.length) return;

  const queue: ReplaySegment[] = [];

  const turningPoints = detectTurningPoints(events);
  const swings = getMomentumSwings(matchId);

  /*
  ========================================
  Turning Points → Replay
  ========================================
  */

  turningPoints.forEach(tp => {

    if (tp.type === "WICKET") {

      queue.push({
        ballIndex: tp.ballIndex,
        type: "WICKET_REPLAY",
        priority: 10
      });

    }

    if (tp.type === "BOUNDARY_BURST") {

      queue.push({
        ballIndex: tp.ballIndex,
        type: "BOUNDARY_REPLAY",
        priority: 6
      });

    }

  });

  /*
  ========================================
  Momentum Swings
  ========================================
  */

  swings.forEach(s => {

    if (s.impact >= 0.8) {

      queue.push({
        ballIndex: s.ballIndex,
        type: "MOMENTUM_SHIFT",
        priority: 8
      });

    }

  });

  /*
  ========================================
  Sort by importance
  ========================================
  */

  queue.sort((a, b) => b.priority - a.priority);

  replayQueue[matchId] = queue;

}