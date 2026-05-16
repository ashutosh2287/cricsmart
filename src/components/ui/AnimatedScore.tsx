"use client";

import { motion, AnimatePresence } from "framer-motion";
import { scorePopVariants } from "@/animations/live-animations";

export default function AnimatedScore({ value }: { value: string | number }) {
  return (
    <div className="relative inline-block overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={value}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={scorePopVariants}
          className="inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
