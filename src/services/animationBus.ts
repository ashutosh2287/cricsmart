/*
================================================
ANIMATION EVENT TYPES (EXTENSIBLE)
================================================
*/

export type AnimationEvent =
  | { type: "SIX"; slug: string }
  | { type: "FOUR"; slug: string }
  | { type: "WICKET"; slug: string }
  | { type: "SCORE_HIGHLIGHT"; slug: string }
  | { type: "ENERGY_SWEEP"; slug: string }
  | { type: "DELTA"; slug: string; value: number }
  | { type: "CAMERA_SHAKE"; slug?: string }
  | { type: "CROWD_ROAR"; slug?: string };

type AnimationListener = (event: AnimationEvent) => void;

let listeners: AnimationListener[] = [];

/*
================================================
PUBLISH EVENT
================================================
*/

export function publishAnimation(event: AnimationEvent) {

  listeners.forEach(listener => listener(event));

}

/*
================================================
SUBSCRIBE
================================================
*/

export function subscribeAnimation(listener: AnimationListener) {

  listeners.push(listener);

  return () => {
    listeners = listeners.filter(l => l !== listener);
  };

}