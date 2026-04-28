import { BallEvent } from "@/types/ballEvent";
import {
  resetMatchState,
  getMatchState,
  MatchState,
  reduceStateOnly,
} from "../matchEngine";
import { clearTimeline } from "../broadcastTimeline";
import { getNearestSnapshot } from "./snapshotStore";

/*
================================================
RUNTIME STATE
================================================
*/

const activeRAF: Record<string, number> = {};

const replayState: Record<
  string,
  {
    index: number;
    isPlaying: boolean;
    isReplayMode: boolean;
  }
> = {};

let replaySpeed = 800;
let replayDirection: 1 | -1 = 1;

/*
================================================
EVENT SUBSCRIPTION (🔥 NO POLLING)
================================================
*/

const listeners = new Set<() => void>();

function emitReplayUpdate() {
  listeners.forEach((l) => l());
}

export function subscribeReplay(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/*
================================================
REBUILD STATE
================================================
*/

async function rebuildFromIndex(
  matchId: string,
  events: BallEvent[],
  targetIndex: number,
  previousState?: MatchState,
  previousIndex?: number
): Promise<MatchState | null> {
  let state: MatchState | null = null;
  let startIndex = 0;

  if (
    previousState &&
    previousIndex !== undefined &&
    previousIndex < targetIndex
  ) {
    state = structuredClone(previousState);
    startIndex = previousIndex + 1;
  } else {
    const snapshot = getNearestSnapshot(matchId, targetIndex);
    const baseState = snapshot?.state ?? getMatchState(matchId);

    state = baseState ? structuredClone(baseState) : null;
    startIndex = snapshot?.index ?? 0;
  }

  if (!state) return null;

  for (let i = startIndex; i <= targetIndex && i < events.length; i++) {
    const event = events[i];
    if (!event) continue;

    state = reduceStateOnly(state, event);
  }

  return state;
}

/*
================================================
START REPLAY (🔥 RAF BASED)
================================================
*/

export function startReplay(matchId: string, events: BallEvent[]) {
  if (activeRAF[matchId]) {
    cancelAnimationFrame(activeRAF[matchId]);
  }

  resetMatchState(matchId);
  clearTimeline(matchId);

  const meta = (replayState[matchId] = {
    index: replayDirection === 1 ? 0 : events.length - 1,
    isPlaying: true,
    isReplayMode: true,
  });

  let lastState: MatchState | null = null;
  let lastIndex = -1;

  let lastTime = performance.now();

  async function loop(now: number) {
    if (!meta.isPlaying) return;

    if (now - lastTime >= replaySpeed) {
      const index = meta.index;

      if (index < 0 || index >= events.length) {
        stopReplay(matchId);
        return;
      }

      const newState = await rebuildFromIndex(
        matchId,
        events,
        index,
        lastState ?? undefined,
        lastIndex
      );

      if (newState) {
        const matchState = getMatchState(matchId);
        if (matchState) {
          Object.assign(matchState, newState);
        }

        lastState = newState;
        lastIndex = index;
      }

      meta.index += replayDirection;

      emitReplayUpdate();

      lastTime = now;
    }

    activeRAF[matchId] = requestAnimationFrame(loop);
  }

  activeRAF[matchId] = requestAnimationFrame(loop);
}

/*
================================================
STOP
================================================
*/

export function stopReplay(matchId: string) {
  if (activeRAF[matchId]) {
    cancelAnimationFrame(activeRAF[matchId]);
    delete activeRAF[matchId];
  }

  if (replayState[matchId]) {
    replayState[matchId].isPlaying = false;
    replayState[matchId].isReplayMode = false;
  }

  emitReplayUpdate();
}

/*
================================================
SEEK (INSTANT)
================================================
*/

export async function replayTillIndex(
  matchId: string,
  events: BallEvent[],
  targetIndex: number
) {
  stopReplay(matchId);

  const newState = await rebuildFromIndex(matchId, events, targetIndex);

  if (!newState) return;

  const matchState = getMatchState(matchId);
  if (matchState) {
    Object.assign(matchState, newState);
  }

  replayState[matchId] = {
    index: targetIndex,
    isPlaying: false,
    isReplayMode: true,
  };

  emitReplayUpdate();
}

/*
================================================
CONTROLS
================================================
*/

export function setReplaySpeed(speed: number) {
  replaySpeed = speed;
}

export function setReplayDirection(direction: 1 | -1) {
  replayDirection = direction;
}

/*
================================================
STATE GETTER
================================================
*/

export function getReplayState(matchId: string) {
  return (
    replayState[matchId] || {
      index: 0,
      isPlaying: false,
      isReplayMode: false,
    }
  );
}