import type { Variants } from "framer-motion";

const easeStandard: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];
const easeSpring: [number, number, number, number] = [0.34, 1.56, 0.64, 1];
const easeSmooth: [number, number, number, number] = [0.4, 0, 0.2, 1];

/* ─── Basic Transitions ─── */

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeStandard },
  },
} satisfies Variants;

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35 } },
} satisfies Variants;

export const slideRight = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: easeStandard },
  },
} satisfies Variants;

export const slideLeft = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: easeStandard },
  },
} satisfies Variants;

export const slideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: easeStandard },
  },
} satisfies Variants;

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.25, ease: easeStandard },
  },
} satisfies Variants;

export const scaleUp = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: easeSpring },
  },
} satisfies Variants;

/* ─── Stagger Container ─── */

export const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
} satisfies Variants;

export const staggerSlow = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
} satisfies Variants;

export const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
} satisfies Variants;

/* ─── Spring Animations ─── */

export const springBounce = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 },
  },
} satisfies Variants;

export const springPop = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 15 },
  },
} satisfies Variants;

export const springGentle = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 25 },
  },
} satisfies Variants;

/* ─── Score / Number Animations ─── */

export const scoreFlip = {
  initial: { y: 24, opacity: 0, scale: 0.8 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 500, damping: 30 },
  },
  exit: {
    y: -24,
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.15 },
  },
} satisfies Variants;

export const countUp = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeSmooth },
  },
} satisfies Variants;

/* ─── Reveal on Scroll ─── */

export const revealOnScroll = {
  hidden: { opacity: 0, y: 40, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easeStandard },
  },
} satisfies Variants;

export const revealFromLeft = {
  hidden: { opacity: 0, x: -60, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easeStandard },
  },
} satisfies Variants;

export const revealFromRight = {
  hidden: { opacity: 0, x: 60, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: easeStandard },
  },
} satisfies Variants;

/* ─── Overlay / Match Animations ─── */

export const overlaySlideIn = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.2 },
  },
} satisfies Variants;

export const wicketShake = {
  animate: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.5, ease: "easeInOut" as const },
  },
} satisfies Variants;

export const boundaryFlash = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 0.3 },
  },
} satisfies Variants;

export const confettiBurst = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 12 },
  },
} satisfies Variants;

/* ─── Card Hover Effects ─── */

export const magneticHover = {
  rest: { scale: 1, boxShadow: "var(--shadow-card)" },
  hover: {
    scale: 1.02,
    boxShadow: "var(--shadow-hover)",
    transition: { duration: 0.3, ease: easeStandard },
  },
  tap: { scale: 0.98 },
} satisfies Variants;

/* ─── Page Transition ─── */

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: easeStandard },
};

/* ─── Text Animations ─── */

export const textReveal = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easeStandard },
  },
} satisfies Variants;

export const typewriter = {
  hidden: { width: 0 },
  visible: {
    width: "100%",
    transition: { duration: 0.8, ease: easeStandard },
  },
} satisfies Variants;
