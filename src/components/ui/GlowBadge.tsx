"use client";

import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  color?: "cyan" | "green" | "red" | "amber" | "purple";
  pulse?: boolean;
  className?: string;
};

const colorStyles = {
  cyan: "bg-[rgba(0,229,255,0.12)] text-[var(--brand)] border-[rgba(0,229,255,0.2)] shadow-[0_0_8px_rgba(0,229,255,0.15)]",
  green: "bg-[rgba(0,255,135,0.12)] text-[var(--success)] border-[rgba(0,255,135,0.2)] shadow-[0_0_8px_rgba(0,255,135,0.15)]",
  red: "bg-[rgba(239,68,68,0.12)] text-[var(--danger)] border-[rgba(239,68,68,0.2)] shadow-[0_0_8px_rgba(239,68,68,0.15)]",
  amber: "bg-[rgba(245,158,11,0.12)] text-[var(--amber)] border-[rgba(245,158,11,0.2)] shadow-[0_0_8px_rgba(245,158,11,0.15)]",
  purple: "bg-[rgba(124,58,237,0.12)] text-[var(--accent)] border-[rgba(124,58,237,0.2)] shadow-[0_0_8px_rgba(124,58,237,0.15)]",
};

export default function GlowBadge({
  children,
  color = "cyan",
  pulse = false,
  className = "",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colorStyles[color]} ${className}`}
    >
      {pulse && (
        <motion.span
          className={`w-1.5 h-1.5 rounded-full ${
            color === "red" ? "bg-[var(--danger)]" :
            color === "green" ? "bg-[var(--success)]" :
            color === "cyan" ? "bg-[var(--brand)]" :
            color === "amber" ? "bg-[var(--amber)]" :
            "bg-[var(--accent)]"
          }`}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
      {children}
    </span>
  );
}
