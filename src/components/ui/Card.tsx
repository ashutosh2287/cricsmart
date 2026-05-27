"use client";

import { motion } from "framer-motion";
import { scaleIn } from "@/components/ui/motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", hover = false, onClick, style }: CardProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      whileHover={
        hover
          ? {
              y: -2,
              boxShadow: "var(--shadow-hover)",
            }
          : undefined
      }
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      style={style}
      className={`rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </motion.div>
  );
}
