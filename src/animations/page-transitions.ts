import type { Variants } from "framer-motion";

import { transitions } from "@/animations/motion-presets";

export const routeTransitionVariants: Variants = {
  initial: { opacity: 0, y: 14, filter: "blur(5px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: transitions.slow },
  exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: transitions.base },
};

export const tabTransitionVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: -6, transition: transitions.fast },
};
