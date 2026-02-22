/*
================================================
REPLAY ENGINE PUBLIC API (DO NOT MODIFY SIGNATURES)
================================================

hydrateReplay(snapshot)
dispatchReplayEvent(ballEvent)
setCursorIndex(index)
startCursorPlayback(timeline, rebuildFn)
stopReplay()

Other files must only use this API.
*/
import { MatchState } from "./matchEngine";
import { BallEvent } from "@/types/ballEvent";

/*
================================================
REPLAY STATE
================================================
*/


let replayState: MatchState | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeReplay(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getReplayState() {
  return replayState;
}

/*
================================================
HYDRATE REPLAY STATE
================================================
*/

export function hydrateReplay(snapshot: MatchState) {
  replayState = JSON.parse(JSON.stringify(snapshot));
  emit();
}

/*
================================================
TIMELINE CURSOR SYSTEM
================================================
*/

type TimelineCursor = {
  index: number;
  isPlaying: boolean;
  speed: number;      // 1 = normal
  direction: 1 | -1;  // forward / reverse
};

const cursor: TimelineCursor = {
  index: 0,
  isPlaying: false,
  speed: 1,
  direction: 1,
};

let playbackInterval: ReturnType<typeof setInterval> | null = null;

/*
------------------------------------------------
CURSOR GETTERS
------------------------------------------------
*/

export function getCursor() {
  return cursor;
}

export function setCursorIndex(index: number) {
  cursor.index = index;
}

export function setCursorPlaying(playing: boolean) {
  cursor.isPlaying = playing;
}

export function setCursorSpeed(speed: number) {
  cursor.speed = speed <= 0 ? 1 : speed;
}

export function setCursorDirection(direction: 1 | -1) {
  cursor.direction = direction;
}

/*
------------------------------------------------
START CURSOR PLAYBACK
------------------------------------------------
*/

export function startCursorPlayback(
  timeline: BallEvent[],
  rebuildFromIndex: (index: number) => MatchState | null
) {

  if (playbackInterval) {
    clearInterval(playbackInterval);
  }

  cursor.isPlaying = true;

  playbackInterval = setInterval(() => {

    if (!cursor.isPlaying) return;

    cursor.index += cursor.direction;

    if (cursor.index < 0) {
      cursor.index = 0;
      cursor.isPlaying = false;
    }

    if (cursor.index >= timeline.length) {
      cursor.index = timeline.length - 1;
      cursor.isPlaying = false;
    }

    const newState = rebuildFromIndex(cursor.index);

    if (newState) {
      replayState = newState;
      emit();
    }

  }, 1000 / cursor.speed);
}

/*
------------------------------------------------
STOP PLAYBACK
------------------------------------------------
*/

export function stopCursorPlayback() {
  cursor.isPlaying = false;

  if (playbackInterval) {
    clearInterval(playbackInterval);
    playbackInterval = null;
  }
}

/*
================================================
LEGACY STOP REPLAY
================================================
*/

export function stopReplay() {
  stopCursorPlayback();
  replayState = null;
  emit();
}

/*
================================================
APPLY SINGLE EVENT DURING REPLAY QUEUE
================================================
*/

export function dispatchReplayEvent(ballEvent: BallEvent) {

  if (!replayState) return;

  replayState.runs += ballEvent.runs;

  if (ballEvent.wicket) {
    replayState.wickets += 1;
  }

  if (ballEvent.isLegalDelivery) {
    replayState.ball += 1;
  }

  if (replayState.ball >= 6) {
    replayState.over += 1;
    replayState.ball = 0;
  }

  emit();
}