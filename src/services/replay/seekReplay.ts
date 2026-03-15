import {
  getEventStream,
  hydrateMatchState,
  reduceStateOnly,
  temporalIndex,
  getSnapshot
} from "@/services/matchEngine";

import { BallEvent } from "@/types/ballEvent";

export function seekReplay(matchId: string, targetIndex: number) {

  const events = getEventStream(matchId);

  if (!events.length) return;

  const indexList = temporalIndex[matchId] ?? [];

  if (!indexList.length) return;

  /*
  =====================================
  Find nearest snapshot using index
  =====================================
  */

  let nearest = indexList[0];

  for (const entry of indexList) {

    if (entry.index <= targetIndex) {
      nearest = entry;
    } else {
      break;
    }

  }

  const snapshot = getSnapshot(
    matchId,
    nearest.innings,
    nearest.over
  );

  if (!snapshot) return;

  /*
  =====================================
  Restore snapshot
  =====================================
  */

  hydrateMatchState(matchId, snapshot);

  /*
  =====================================
  Replay remaining balls
  =====================================
  */

  let state = snapshot;

  for (let i = nearest.index; i <= targetIndex; i++) {

    const event: BallEvent = events[i];

    state = reduceStateOnly(state, event);

  }

}