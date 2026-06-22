"use client";

import { motion } from "framer-motion";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  style?: React.CSSProperties;
}

export function GlowCard({ children, className = "", glowColor = "var(--brand)", style }: GlowCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: "color-mix(in srgb, var(--surface) 80%, var(--surface-3))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        ...style,
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${glowColor} 12%, transparent), color-mix(in srgb, ${glowColor} 4%, transparent))`,
          borderRadius: "inherit",
        }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-[1px] opacity-0"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        style={{
          borderRadius: "inherit",
          padding: "1px",
          background: `linear-gradient(135deg, ${glowColor}, color-mix(in srgb, ${glowColor} 30%, transparent), ${glowColor})`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
