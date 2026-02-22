/*
================================================
REPLAY CONTROLLER

ROLE:

- orchestrates replay modes
- selects snapshots
- converts index/over into actions

NEVER:

- mutate replay state directly
- apply events
================================================
*/
import { getSnapshot, getMatchState } from "./matchEngine";
import {
  hydrateReplay,
  setCursorIndex,
  startCursorPlayback
} from "./replayEngine";
import { enqueueReplay, startReplayQueue } from "./replayEventQueue";
import { rebuildStateFromIndex } from "./timelineScrubber";

/*
================================================
REPLAY FULL OVER (cinematic queue replay)
================================================
*/

export function replayOver(matchId: string, over: number) {

  const snapshot = getSnapshot(matchId, over - 1);

  if (!snapshot) {
    console.warn("No snapshot available");
    return;
  }

  hydrateReplay(snapshot);

  const liveState = getMatchState(matchId);
  if (!liveState) return;

  const events = liveState.overs?.[over];

  if (!events?.length) {
    console.warn("No events for this over");
    return;
  }

  enqueueReplay(events);
  startReplayQueue();
}

/*
================================================
INSTANT SCRUB (INDEX BASED)
================================================
*/

export function scrubToPosition(
  matchId: string,
  targetIndex: number
) {

  const liveState = getMatchState(matchId);
  if (!liveState) return;

  const timeline = liveState.timelineIndex;
  if (!timeline || !timeline.length) return;

  if (targetIndex < 0 || targetIndex >= timeline.length) return;

  /*
  -----------------------------------
  Update cursor
  -----------------------------------
  */

  setCursorIndex(targetIndex);

  /*
  -----------------------------------
  Rebuild replay state
  -----------------------------------
  */

  const rebuilt = rebuildStateFromIndex(
    matchId,
    targetIndex,
    liveState
  );

  if (rebuilt) {
    hydrateReplay(rebuilt);
  }
}

/*
================================================
START CURSOR PLAYBACK
================================================
*/

export function playFromCurrentCursor(matchId: string) {

  const liveState = getMatchState(matchId);
  if (!liveState) return;

  const timeline = liveState.timelineIndex;
  if (!timeline || !timeline.length) return;

  startCursorPlayback(
    timeline,
    (index) => rebuildStateFromIndex(matchId, index, liveState)
  );
}