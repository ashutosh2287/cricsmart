import { getEventStream } from "../matchEngine";
import { rebuildNarrativeFromStream } from "../narrative/narrativeEngine";

type ReplayState = {
  index: number;
};

const replayStore: Record<string, ReplayState> = {};

export function getReplayState(matchId: string) {
  return replayStore[matchId];
}

export function setReplayIndex(
  matchId: string,
  branchId: string,
  index: number
) {

  const events = getEventStream(matchId);

  const clampedIndex =
    Math.max(0, Math.min(index, events.length - 1));

  replayStore[matchId] = {
    index: clampedIndex
  };

  /*
  Rebuild analytics up to this ball
  */

  rebuildNarrativeFromStream(
    matchId,
    branchId,
    clampedIndex
  );

}