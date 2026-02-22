import { MatchState, getSnapshot, reduceStateOnly } from "./matchEngine";

export function rebuildStateFromIndex(
  matchId: string,
  targetIndex: number,
  liveState: MatchState
): MatchState | null {

  const timeline = liveState.timelineIndex;

  if (!timeline || !timeline.length) return null;

  const targetEvent = timeline[targetIndex];

  if (!targetEvent) return null;

  const targetOver = Math.floor(targetEvent.over);

  let snapshotOver = targetOver;
  let snapshot;

  while (snapshotOver >= 0) {

    snapshot = getSnapshot(matchId, snapshotOver);

    if (snapshot) break;

    snapshotOver--;
  }

  if (!snapshot) return null;

  let state: MatchState = JSON.parse(JSON.stringify(snapshot));

  for (let i = 0; i <= targetIndex; i++) {
    state = reduceStateOnly(state, timeline[i]);
  }

  return state;
}