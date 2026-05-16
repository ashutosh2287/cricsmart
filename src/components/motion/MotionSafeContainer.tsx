"use client";

import React from "react";
import { motion, useReducedMotion, type Transition, type Variants } from "framer-motion";
import { pageRevealVariants, transitions } from "@/animations/motion-presets";
import MotionFallbackBoundary from "@/components/motion/MotionFallbackBoundary";

type MotionSafeContainerProps = {
  children: React.ReactNode;
  className?: string;
  enableMotion?: boolean;
  variants?: Variants;
  transition?: Transition;
};

/**
 * Renders children with optional motion and automatically falls back to plain rendering.
 */
export default function MotionSafeContainer({
  children,
  className,
  enableMotion = true,
  variants = pageRevealVariants,
  transition = transitions.base,
}: MotionSafeContainerProps) {
  const reduceMotion = useReducedMotion();

  if (!enableMotion || reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionFallbackBoundary fallback={<div className={className}>{children}</div>}>
      <motion.div
        className={className}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={transition}
      >
        {children}
      </motion.div>
    </MotionFallbackBoundary>
  );
}
