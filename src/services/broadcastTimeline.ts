import { BallEvent } from "@/types/ballEvent";

type TimelineHandler = (event: BallEvent) => void;

const queue: BallEvent[] = [];

const listeners = new Set<TimelineHandler>();

let running = false;
let nextEventTime = 0;

/*
====================================
SUBSCRIBE
====================================
*/

export function subscribeTimeline(cb: TimelineHandler) {

  listeners.add(cb);

  return () => {
    listeners.delete(cb);
  };
}

/*
====================================
ADD EVENT TO TIMELINE
====================================
*/

export function pushToTimeline(event: BallEvent) {

  queue.push(event);

  start();
}

/*
====================================
START ENGINE
====================================
*/

function start() {

  if (running) return;

  running = true;
  nextEventTime = performance.now();

  scheduleNextFrame(loop);

}

/*
====================================
FRAME LOOP (🔥 CINEMATIC ENGINE)
====================================
*/

function loop(now: number) {

  if (!running) return;

  if (queue.length === 0) {

    running = false;
    return;

  }

  if (now >= nextEventTime) {

    const event = queue.shift();

    if (event) {

      listeners.forEach(cb => cb(event));

      nextEventTime = now + getDelay(event);

    }

  }

  scheduleNextFrame(loop);

}

/*
====================================
SMART DELAY LOGIC
====================================
*/

function getDelay(event: BallEvent) {

  // base cinematic delay
  let baseDelay = 500;

  if (event.wicket) baseDelay = 2000;
  else if (event.type === "SIX") baseDelay = 1500;
  else if (event.type === "FOUR") baseDelay = 1200;

  /*
  =====================================
  ADAPTIVE SPEED LOGIC 😈
  =====================================
  */

  const queueSize = queue.length;

  let speedMultiplier = 1;

  if (queueSize >= 8) speedMultiplier = 4;       // very fast catch-up
  else if (queueSize >= 5) speedMultiplier = 3;
  else if (queueSize >= 3) speedMultiplier = 2;

  return baseDelay / speedMultiplier;
}
function scheduleNextFrame(cb: (time: number) => void) {

  // browser environment
  if (typeof window !== "undefined" && typeof window.requestAnimationFrame === "function") {

    window.requestAnimationFrame(cb);

  } else {

    // server fallback (Node.js safe)
    setTimeout(() => cb(performance.now()), 16);

  }

}
