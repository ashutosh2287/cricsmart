import type { Transition, Variants } from "framer-motion";

export const MOTION_TIMINGS = {
  fast: 0.16,
  base: 0.24,
  slow: 0.34,
} as const;

export const MOTION_EASING = {
  standard: [0.22, 1, 0.36, 1] as const,
  emphasized: [0.2, 0.8, 0.2, 1] as const,
};

export const transitions = {
  fast: {
    duration: MOTION_TIMINGS.fast,
    ease: MOTION_EASING.standard,
  } satisfies Transition,
  base: {
    duration: MOTION_TIMINGS.base,
    ease: MOTION_EASING.standard,
  } satisfies Transition,
  slow: {
    duration: MOTION_TIMINGS.slow,
    ease: MOTION_EASING.emphasized,
  } satisfies Transition,
};

export const pageRevealVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const tabContentVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};
