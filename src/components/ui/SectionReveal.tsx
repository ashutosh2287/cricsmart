"use client";

import { motion } from "framer-motion";
import { staggerGrid, gridItem } from "./motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
};

export default function SectionReveal({
  children,
  className = "",
  direction = "up",
}: Props) {
  return (
    <motion.div
      variants={staggerGrid}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={gridItem} className={className}>
      {children}
    </motion.div>
  );
}
