import type { Variants } from "framer-motion";

import { transitions } from "@/animations/motion-presets";
import {
  type LiveEnergyState,
  liveEnergyVariantsByState,
  livePulseEnergyVariants,
} from "@/animations/live-energy";

export const scorePopVariants: Variants = {
  initial: { scale: 0.98, opacity: 0.68 },
  animate: { scale: 1, opacity: 1, transition: transitions.fast },
  exit: { scale: 1.01, opacity: 0, transition: transitions.fast },
};

export const commentaryArrivalVariants: Variants = {
  initial: liveEnergyVariantsByState.regular.initial,
  animate: liveEnergyVariantsByState.regular.animate,
  exit: liveEnergyVariantsByState.regular.exit,
};

export const livePulseVariants: Variants = {
  breathing: livePulseEnergyVariants.breathing,
};

export function getCommentaryEnergyVariants(state: LiveEnergyState): Variants {
  return liveEnergyVariantsByState[state];
}
