"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/components/ui/motion";

export default function PageMotion({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp}>
      {children}
    </motion.div>
  );
}
