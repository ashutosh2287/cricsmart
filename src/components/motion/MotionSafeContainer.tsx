"use client";

import React from "react";
import { motion, type Transition, type Variants } from "framer-motion";

type MotionSafeContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  enableMotion?: boolean;
  variants?: Variants;
  transition?: Transition;
  initial?: string;
  animate?: string;
  exit?: string;
};

export default function MotionSafeContainer({
  children,
  className,
  style,
  enableMotion = true,
  variants,
  transition,
  initial = "initial",
  animate = "animate",
  exit = "exit",
}: MotionSafeContainerProps) {
  const canAnimate = enableMotion && typeof window !== "undefined";

  if (!canAnimate) {
    return (
      <div className={className} style={style} data-motion-safe-container="fallback">
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={initial}
      animate={animate}
      exit={exit}
      variants={variants}
      transition={transition}
      data-motion-safe-container="enhanced"
    >
      {children}
    </motion.div>
  );
}
