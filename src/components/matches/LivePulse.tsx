"use client";

import { motion } from "framer-motion";
import { livePulseVariants } from "@/animations/live-animations";

export function LivePulse() {
  return (
    <motion.span
      className="live-pulse-dot"
      variants={livePulseVariants}
      animate="breathing"
      aria-hidden="true"
    />
  );
}
