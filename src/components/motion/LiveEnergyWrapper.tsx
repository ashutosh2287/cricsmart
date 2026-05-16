"use client";

import React from "react";
import { motion } from "framer-motion";
import type { LiveEnergyState } from "@/animations/live-energy";
import { getCommentaryEnergyVariants } from "@/animations/live-animations";
import MotionFallbackBoundary from "@/components/motion/MotionFallbackBoundary";

type LiveEnergyWrapperProps = {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
  state?: LiveEnergyState;
};

export default function LiveEnergyWrapper({
  children,
  className,
  enabled = true,
  state = "regular",
}: LiveEnergyWrapperProps) {
  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <MotionFallbackBoundary fallback={<div className={className}>{children}</div>}>
      <motion.div
        className={className}
        initial="initial"
        animate="animate"
        variants={getCommentaryEnergyVariants(state)}
      >
        {children}
      </motion.div>
    </MotionFallbackBoundary>
  );
}
