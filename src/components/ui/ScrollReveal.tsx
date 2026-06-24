"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "left" | "right" | "scale";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
}

const directionVariants = {
  up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1 } },
};

export default function ScrollReveal({
  children,
  className = "",
  direction = "up",
  delay = 0,
  duration = 0.5,
}: ScrollRevealProps) {
  return (
    <motion.div
      variants={directionVariants[direction]}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
