"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?: boolean;
  style?: React.CSSProperties;
}

export function Card({ children, className = "", hover = false, onClick, accent = false, style }: CardProps) {
  return (
    <motion.div
      whileHover={
        hover
          ? { y: -4, boxShadow: "0 8px 30px rgba(29, 158, 117, 0.18)" }
          : undefined
      }
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={className}
      style={{
        background: accent ? "var(--brand-light)" : "var(--surface)",
        border: `0.5px solid ${accent ? "var(--brand)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
