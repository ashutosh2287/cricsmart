/*
================================================
REPLAY EVENT QUEUE

ONLY RESPONSIBLE FOR:

- sequential playback timing
- animation synchronization

NEVER:

- rebuild replay state
- access matchEngine
- modify cursor
================================================
*/
import { BallEvent } from "@/types/ballEvent";
import { dispatchReplayEvent } from "./replayEngine";
import { waitForAnimationComplete } from "./animationBus";

let queue: BallEvent[] = [];
let playing = false;

export function enqueueReplay(events: BallEvent[]) {
  queue = [...events];
}

export async function startReplayQueue() {

  if (playing) return;
  playing = true;

  console.log("Replay started");

  while (queue.length && playing) {

    const event = queue.shift();
    if (!event) break;

    console.log("Replaying event:", event);

    dispatchReplayEvent(event);

    await waitForAnimationComplete("REPLAY");
  }

  playing = false;

  console.log("Replay finished");
}

export function stopReplayQueue() {
  playing = false;
}