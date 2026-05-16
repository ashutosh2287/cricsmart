"use client";

import { motion } from "framer-motion";
import { pageRevealVariants, transitions } from "@/animations/motion-presets";

export default function PageMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageRevealVariants}
      transition={transitions.base}
    >
      {children}
    </motion.div>
  );
}
