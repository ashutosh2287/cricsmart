"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { routeTransitionVariants } from "@/animations/page-transitions";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={routeTransitionVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
