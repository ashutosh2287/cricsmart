import {
  publishAnimation,
  waitForAnimationComplete,
  AnimationEvent,
  AnimationChannel,
} from "@/services/animationBus";

type QueueItem = {
  event: AnimationEvent;
  priority: number;
};

const queue: QueueItem[] = [];

let isPlaying = false;

export async function enqueueAnimation(
  event: AnimationEvent,
  channel: AnimationChannel = "LIVE"
) {
  // 🚨 HIGH PRIORITY INTERRUPT
  if (shouldInterrupt(event)) {
    queue.unshift({
      event,
      priority: getPriority(event),
    });
  } else {
    queue.push({
      event,
      priority: getPriority(event),
    });

    queue.sort((a, b) => b.priority - a.priority);
  }

  if (!isPlaying) {
    processQueue(channel);
  }
}

async function processQueue(channel: AnimationChannel) {
  isPlaying = true;

  while (queue.length > 0) {
    const item = queue.shift()!;
    const event = item.event;
    publishAnimation(event, channel);

    // ⏳ wait for overlay to finish
    await waitForAnimationComplete(channel);
  }

  isPlaying = false;
}
function getPriority(event: AnimationEvent): number {
  switch (event.type) {
    case "WICKET":
      return 100;

    case "CAMERA_SHAKE":
      return 90;

    case "SIX":
      return 80;

    case "CROWD_ROAR":
      return 70;

    case "FOUR":
      return 60;

    case "ENERGY_SWEEP":
      return 50;

    case "DELTA":
      return 10;

    default:
      return 0;
  }
}

function shouldInterrupt(event: AnimationEvent): boolean {
  return event.type === "WICKET";
}