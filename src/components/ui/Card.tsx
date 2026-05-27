"use client";

import { motion } from "framer-motion";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?: boolean;
}

export function Card({ children, className = "", hover = false, onClick, accent = false }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: "var(--shadow-hover)" } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={className}
      style={{
        background: accent ? "var(--brand-light)" : "var(--surface)",
        border: `0.5px solid ${accent ? "var(--brand)" : "var(--border)"}`,
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.2s ease, transform 0.2s ease",
      }}
    >
      {children}
    </motion.div>
  );
}
