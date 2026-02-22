/*
================================================
ANIMATION EVENT TYPES (EXTENSIBLE)
================================================
*/

export type AnimationChannel = "LIVE" | "REPLAY";

export type AnimationEvent =
  | { type: "SIX"; slug: string }
  | { type: "FOUR"; slug: string }
  | { type: "WICKET"; slug: string }
  | { type: "SCORE_HIGHLIGHT"; slug: string }
  | { type: "ENERGY_SWEEP"; slug: string }
  | { type: "DELTA"; slug: string; value: number }
  | { type: "CAMERA_SHAKE"; slug?: string }
  | { type: "CROWD_ROAR"; slug?: string };

/*
================================================
ANIMATION EVENT BUS
================================================
*/

type AnimationEventListener = (
  event: AnimationEvent,
  channel: AnimationChannel
) => void;

let animationListeners: AnimationEventListener[] = [];

export function publishAnimation(
  event: AnimationEvent,
  channel: AnimationChannel = "LIVE"
) {
  animationListeners.forEach(listener => listener(event, channel));
}

export function subscribeAnimation(listener: AnimationEventListener) {
  animationListeners.push(listener);

  return () => {
    animationListeners = animationListeners.filter(l => l !== listener);
  };
}

/*
================================================
ANIMATION COMPLETION SIGNAL
================================================
*/

type AnimationCompleteListener = (channel: AnimationChannel) => void;

let completionListeners: AnimationCompleteListener[] = [];

export function onAnimationComplete(listener: AnimationCompleteListener) {
  completionListeners.push(listener);

  return () => {
    completionListeners = completionListeners.filter(l => l !== listener);
  };
}

export function emitAnimationComplete(channel: AnimationChannel = "LIVE") {
  completionListeners.forEach(listener => listener(channel));
}

/*
================================================
PROMISE-BASED WAIT (CRITICAL FOR REPLAY QUEUE)
================================================
*/

export function waitForAnimationComplete(
  channel: AnimationChannel = "LIVE"
): Promise<void> {

  return new Promise(resolve => {

    const unsubscribe = onAnimationComplete((completedChannel) => {

      if (completedChannel !== channel) return;

      unsubscribe();
      resolve();
    });

  });

}