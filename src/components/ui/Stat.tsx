"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useCountUp } from "@/hooks/useCountUp";

interface StatProps {
  label: string;
  value: string | number;
  accent?: boolean;
  index?: number;
}

export function Stat({ label, value, accent = false, index = 0 }: StatProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-40px" });
  const isNumeric = typeof value === "number";

  const { ref: countRef, display } = useCountUp({
    end: isNumeric ? value : 0,
    duration: 1600,
    startOnView: isInView,
    prefix: "",
    suffix: "",
  });

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: 1.03 }}
      style={{
        background: accent ? "var(--brand-light)" : "var(--surface-3)",
        borderRadius: "var(--radius-md)",
        padding: "12px 16px",
        textAlign: "center",
      }}
    >
      <div
        ref={countRef}
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: accent ? "var(--brand-text)" : "var(--text-1)",
          fontFamily: "var(--font-display)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {isNumeric ? display : value}
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
