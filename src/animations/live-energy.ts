import type { Variants } from "framer-motion";

import { MOTION_EASING, MOTION_TIMINGS } from "@/animations/motion-presets";

export type ImportanceTier = 1 | 2 | 3;

export type LiveEnergyState =
  | "regular"
  | "boundary"
  | "wicket"
  | "pressure"
  | "momentum"
  | "turningPoint"
  | "milestone"
  | "collapse"
  | "partnership"
  | "requiredRrDanger";

export const importanceTierClassMap: Record<
  ImportanceTier,
  {
    glowClass: string;
    animationClass: string;
    borderClass: string;
    textClass: string;
    commentaryClass: string;
  }
> = {
  1: {
    glowClass: "tier-1-glow",
    animationClass: "tier-1-motion",
    borderClass: "tier-1-border",
    textClass: "tier-1-text",
    commentaryClass: "tier-1-commentary",
  },
  2: {
    glowClass: "tier-2-glow",
    animationClass: "tier-2-motion",
    borderClass: "tier-2-border",
    textClass: "tier-2-text",
    commentaryClass: "tier-2-commentary",
  },
  3: {
    glowClass: "tier-3-glow",
    animationClass: "tier-3-motion",
    borderClass: "tier-3-border",
    textClass: "tier-3-text",
    commentaryClass: "tier-3-commentary",
  },
};

export const liveEnergyTierByState: Record<LiveEnergyState, ImportanceTier> = {
  regular: 1,
  boundary: 2,
  wicket: 3,
  pressure: 2,
  momentum: 2,
  turningPoint: 3,
  milestone: 2,
  collapse: 3,
  partnership: 2,
  requiredRrDanger: 3,
};

const tierScaleMap: Record<ImportanceTier, number> = {
  1: 1,
  2: 1.015,
  3: 1.03,
};

const tierYOffsetMap: Record<ImportanceTier, number> = {
  1: 3,
  2: 4,
  3: 6,
};

export function getTierFromState(state: LiveEnergyState): ImportanceTier {
  return liveEnergyTierByState[state];
}

export function getLiveEnergyStateFromTag(tag: string | null | undefined): LiveEnergyState {
  if (!tag) return "regular";
  const normalized = tag.trim().toUpperCase();

  if (normalized === "WICKET") return "wicket";
  if (normalized === "FOUR" || normalized === "SIX" || normalized === "BOUNDARY") return "boundary";
  if (normalized.includes("PRESSURE")) return "pressure";
  if (normalized.includes("MOMENTUM")) return "momentum";
  if (normalized.includes("TURNING")) return "turningPoint";
  if (normalized.includes("MILESTONE")) return "milestone";
  if (normalized.includes("COLLAPSE")) return "collapse";
  if (normalized.includes("PARTNERSHIP")) return "partnership";
  if (normalized.includes("RRR") || normalized.includes("REQ")) return "requiredRrDanger";
  return "regular";
}

function createEnergyVariants(tier: ImportanceTier): Variants {
  const scale = tierScaleMap[tier];
  const y = tierYOffsetMap[tier];

  return {
    initial: { opacity: 0, y, scale: 0.99 },
    animate: {
      opacity: 1,
      y: 0,
      scale,
      transition: {
        duration: MOTION_TIMINGS.base,
        ease: MOTION_EASING.standard,
      },
    },
    exit: {
      opacity: 0,
      y: -Math.max(2, y - 2),
      scale: 0.99,
      transition: {
        duration: MOTION_TIMINGS.fast,
        ease: MOTION_EASING.standard,
      },
    },
  };
}

export const liveEnergyVariantsByState: Record<LiveEnergyState, Variants> = {
  regular: createEnergyVariants(1),
  boundary: createEnergyVariants(2),
  wicket: createEnergyVariants(3),
  pressure: createEnergyVariants(2),
  momentum: createEnergyVariants(2),
  turningPoint: createEnergyVariants(3),
  milestone: createEnergyVariants(2),
  collapse: createEnergyVariants(3),
  partnership: createEnergyVariants(2),
  requiredRrDanger: createEnergyVariants(3),
};

export const livePulseEnergyVariants: Variants = {
  breathing: {
    opacity: [0.78, 1, 0.78],
    scale: [0.98, 1.05, 0.98],
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
