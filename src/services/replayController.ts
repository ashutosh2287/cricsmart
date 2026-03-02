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

import { getSnapshot, getMatchState, getEventStream } from "./matchEngine";
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

  const matchState = getMatchState(matchId);

if (!matchState) {
  console.warn("Match not found");
  return;
}

const inningsIndex = matchState.currentInningsIndex;

const snapshot = getSnapshot(
  matchId,
  inningsIndex,
  over - 1
);

  if (!snapshot) {
    console.warn("No snapshot available");
    return;
  }

  hydrateReplay(snapshot);

  const liveState = getMatchState(matchId);
if (!liveState) return;

const innings = liveState.innings[liveState.currentInningsIndex];

if (!innings) {
  console.warn("No innings found");
  return;
}

const events = innings.overs?.[over];

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

  // ✅ canonical timeline source
  const timeline = getEventStream(matchId);

  if (!timeline.length) return;
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

  // ✅ canonical timeline source
  const timeline = getEventStream(matchId);

  if (!timeline.length) return;

  startCursorPlayback(
    timeline,
    (index) => rebuildStateFromIndex(matchId, index, liveState)
  );
}