/*
================================================
ZERO REACT ANIMATION CONTROLLER
================================================
*/

import { emitAnimationComplete, AnimationChannel } from "./animationBus";

export function playAnimation(
  element: HTMLElement | null,
  className: string,
  duration = 500,
  channel: AnimationChannel = "LIVE" // ⭐ NEW
) {

  if (!element) return;

  element.classList.add(className);

  setTimeout(() => {
    element.classList.remove(className);

    // ⭐ Notify correct animation channel finished
    emitAnimationComplete(channel);

  }, duration);

}