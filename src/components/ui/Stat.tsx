"use client";

import { motion } from "framer-motion";

export function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        background: accent ? "var(--brand-light)" : "var(--surface-3)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: accent ? "var(--brand-text)" : "var(--text-1)",
          fontFamily: "var(--font-display)",
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: accent ? "var(--brand)" : "var(--text-3)",
          marginTop: 2,
        }}
      >
        {label}
      </div>
    </motion.div>
  );
}
