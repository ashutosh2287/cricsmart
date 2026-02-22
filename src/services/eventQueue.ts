import { dispatchBallEvent } from "@/services/matchEngine";
import { onAnimationComplete } from "@/services/animationBus";

/*
================================================
EVENT TYPES
================================================
*/

type EngineBallEvent =
  | { type: "RUN"; runs?: number }
  | { type: "FOUR" }
  | { type: "SIX" }
  | { type: "WICKET" }
  | { type: "WD" }
  | { type: "NB" };

type QueueItem = {
  matchId: string;
  event: EngineBallEvent;
};

/*
================================================
QUEUE STATE
================================================
*/

const queue: QueueItem[] = [];

const highlights: QueueItem[] = [];

let isProcessing = false;
let isPaused = false;

/*
================================================
PUBLIC CONTROLS
================================================
*/

export function pauseQueue() {
  isPaused = true;
}

export function resumeQueue() {
  isPaused = false;
  processQueue();
}

export function getHighlights() {
  return highlights;
}

/*
================================================
ENQUEUE EVENT
================================================
*/

export function enqueueBallEvent(matchId: string, event: EngineBallEvent) {

  // Save highlights automatically
  if (event.type === "SIX" || event.type === "WICKET") {
    highlights.push({ matchId, event });
  }

  queue.push({ matchId, event });

  processQueue();
}

/*
================================================
PROCESS QUEUE (ANIMATION SYNC MODE)
================================================
*/

function processQueue() {

  if (isProcessing) return;
  if (isPaused) return;
  if (queue.length === 0) return;

  isProcessing = true;

  const { matchId, event } = queue.shift()!;

  // Dispatch to engine
  dispatchBallEvent(matchId, event);

  // Wait for animation finish signal
  const unsubscribe = onAnimationComplete(() => {

    unsubscribe(); // prevent duplicate listeners

    isProcessing = false;

    processQueue();

  });

}