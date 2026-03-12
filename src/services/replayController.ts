import { getEventStream } from "./matchEngine";
import { rebuildNarrativeFromStream } from "./narrative/narrativeEngine";
import { updateMatchPhase } from "./analytics/matchPhaseEngine";
import { detectMomentumSwing } from "./analytics/momentumSwingEngine";
import { generateBroadcastInsights } from "./broadcast/broadcastInsightEngine";
import { runMatchPredictor } from "./prediction/matchPredictorEngine";

type ReplayState = {
  position: number;
};

const replayStore: Record<string, ReplayState> = {};

export function getReplayPosition(matchId: string) {
  return replayStore[matchId]?.position ?? 0;
}

export function scrubToPosition(
  matchId: string,
  index: number,
  branchId: string = "main"
) {

  const events = getEventStream(matchId) ?? [];

  if (!events.length) return;

  const clampedIndex = Math.max(
    0,
    Math.min(index, events.length - 1)
  );

  replayStore[matchId] = {
    position: clampedIndex
  };

  /*
  ========================================
  Rebuild Narrative Timeline
  ========================================
  */

  rebuildNarrativeFromStream(
    matchId,
    branchId,
    clampedIndex
  );

  /*
  ========================================
  Re-run Intelligence Engines
  ========================================
  */

  updateMatchPhase(matchId);

  detectMomentumSwing(matchId);

  generateBroadcastInsights(matchId);

  runMatchPredictor(matchId);

}

export function playFromCurrentCursor(
  matchId: string,
  branchId: string = "main"
) {

  const events = getEventStream(matchId) ?? [];
  const start = getReplayPosition(matchId);

  if (!events.length) return;

  let cursor = start;

  const interval = setInterval(() => {

    if (cursor >= events.length - 1) {
      clearInterval(interval);
      return;
    }

    cursor++;

    scrubToPosition(matchId, cursor, branchId);

  }, 600); // 600ms per ball replay speed

}