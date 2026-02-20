/*
================================================
ZERO REACT ANIMATION CONTROLLER
================================================
*/

export function playAnimation(
  element: HTMLElement | null,
  className: string,
  duration = 500
) {

  if (!element) return;

  element.classList.add(className);

  setTimeout(() => {
    element.classList.remove(className);
  }, duration);

}