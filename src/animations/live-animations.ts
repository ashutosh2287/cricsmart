import type { Variants } from "framer-motion";

import { transitions } from "@/animations/motion-presets";

export const scorePopVariants: Variants = {
  initial: { scale: 0.96, opacity: 0.6, filter: "blur(2px)" },
  animate: { scale: 1, opacity: 1, filter: "blur(0px)", transition: transitions.fast },
  exit: { scale: 1.02, opacity: 0, filter: "blur(2px)", transition: transitions.fast },
};

export const commentaryArrivalVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: -6, transition: transitions.fast },
};

export const livePulseVariants: Variants = {
  breathing: {
    opacity: [0.75, 1, 0.75],
    scale: [0.96, 1.08, 0.96],
    boxShadow: [
      "0 0 0 0 rgba(255, 77, 90, 0.18)",
      "0 0 0 5px rgba(255, 77, 90, 0)",
      "0 0 0 0 rgba(255, 77, 90, 0.18)",
    ],
    transition: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
  },
};
