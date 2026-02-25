import {
  MatchState,
  getSnapshot,
  reduceStateOnly,
  getEventStream
} from "./matchEngine";
import { resetAnalytics, processAnalyticsEvent } from "./analytics/analyticsEngine";
import { processHighlightEvent } from "./highlights/highlightEngine";
import { resetDirectorState } from "./directorEngine";

/*
-------------------------------------------------------
TEMPORAL INDEX TYPE
-------------------------------------------------------
*/

type TimelineAnchor = {
  index: number;
  over: number;
};

/*
-------------------------------------------------------
IMPORT TEMPORAL INDEX FROM ENGINE
-------------------------------------------------------
*/

// IMPORTANT:
// You must export temporalIndex from matchEngine.ts:
// export const temporalIndex = ...
// Then import it here instead of declare.

import { temporalIndex } from "./matchEngine";

/*
-------------------------------------------------------
REBUILD STATE FROM CANONICAL EVENT STREAM
-------------------------------------------------------
*/

export function rebuildStateFromIndex(
  matchId: string,
  targetIndex: number,
  liveState: MatchState
): MatchState | null {

  const timeline = getEventStream(matchId);

  if (!timeline.length) return null;

  const targetEvent = timeline[targetIndex];
  if (!targetEvent) return null;

  /*
  -------------------------------------------------------
  FIND NEAREST TEMPORAL ANCHOR
  -------------------------------------------------------
  */

  const anchors: TimelineAnchor[] = temporalIndex?.[matchId] || [];

  let startIndex = 0;
  let snapshot: MatchState | null = null;

  for (let i = anchors.length - 1; i >= 0; i--) {

    if (anchors[i].index <= targetIndex) {

      startIndex = anchors[i].index;
      snapshot = getSnapshot(matchId, anchors[i].over) ?? null;
      break;
    }
  }

  /*
  -------------------------------------------------------
  FALLBACK SNAPSHOT SEARCH
  -------------------------------------------------------
  */

  if (!snapshot) {

    const targetOver = Math.floor(targetEvent.over);
    let snapshotOver = targetOver;

    while (snapshotOver >= 0) {

      snapshot = getSnapshot(matchId, snapshotOver);

      if (snapshot) break;

      snapshotOver--;
    }
  }

  if (!snapshot) return null;

  /*
  -------------------------------------------------------
  CLONE SNAPSHOT
  -------------------------------------------------------
  */

  let state: MatchState = JSON.parse(JSON.stringify(snapshot));
  /*
-------------------------------------------------------
RESET PROJECTION SYSTEMS (DETERMINISTIC REBUILD)
-------------------------------------------------------
*/

resetAnalytics(matchId);
resetDirectorState(liveState.activeBranchId);

  /*
  -------------------------------------------------------
  REBUILD FROM ANCHOR TO TARGET INDEX
  -------------------------------------------------------
  */

  for (let i = startIndex; i <= targetIndex; i++) {

    const event = timeline[i];

    if (!event?.valid) continue;

    // Branch filtering
    if (event.branchId && event.branchId !== liveState.activeBranchId) {
      continue;
    }

    state = reduceStateOnly(state, event);

/*
-------------------------------------------------------
REBUILD PROJECTIONS
-------------------------------------------------------
*/

// rebuild analytics (will emit signals internally)
processAnalyticsEvent(matchId, event);

// rebuild highlight detection
processHighlightEvent(matchId, event);
  }

  return state;
}