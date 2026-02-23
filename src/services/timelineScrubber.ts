import { MatchState, getSnapshot, reduceStateOnly } from "./matchEngine";

/*
-------------------------------------------------------
TEMPORAL INDEX TYPE (must match matchEngine.ts)
-------------------------------------------------------
*/

type TimelineAnchor = {
  index: number;
  over: number;
};

/*
-------------------------------------------------------
TEMPORAL INDEX STORE
NOTE:
This must be exported from matchEngine.ts
If already exported there, import instead.
-------------------------------------------------------
*/

// If you already exported temporalIndex from matchEngine,
// replace this with:
// import { temporalIndex } from "./matchEngine";

declare const temporalIndex: Record<string, TimelineAnchor[]>;

/*
-------------------------------------------------------
REBUILD STATE FROM TIMELINE INDEX
-------------------------------------------------------
*/

export function rebuildStateFromIndex(
  matchId: string,
  targetIndex: number,
  liveState: MatchState
): MatchState | null {

  const timeline = liveState.timelineIndex;

  if (!timeline || !timeline.length) return null;

  const targetEvent = timeline[targetIndex];

  if (!targetEvent) return null;

  /*
  -------------------------------------------------------
  FIND NEAREST TEMPORAL ANCHOR
  -------------------------------------------------------
  */

  const anchors = temporalIndex?.[matchId] || [];

  let startIndex = 0;
  let snapshot: MatchState | null = null;

  // find nearest anchor before target index
  for (let i = anchors.length - 1; i >= 0; i--) {

    if (anchors[i].index <= targetIndex) {

      startIndex = anchors[i].index;

      snapshot = getSnapshot(matchId, anchors[i].over) ?? null;

      break;
    }
  }

  /*
  -------------------------------------------------------
  FALLBACK IF NO TEMPORAL ANCHOR FOUND
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
  REBUILD ONLY FROM START INDEX (PERFORMANCE OPTIMIZED)
  -------------------------------------------------------
  */

  for (let i = startIndex; i <= targetIndex; i++) {

    const event = timeline[i];

    if (!event?.valid) continue;

    // ⭐ branch filtering
    if (event.branchId && event.branchId !== liveState.activeBranchId) {
      continue;
    }

    state = reduceStateOnly(state, event);
  }

  return state;
}