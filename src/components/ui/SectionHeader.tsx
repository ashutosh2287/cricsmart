"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeader({ eyebrow, title, description, align = "left" }: SectionHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      style={{
        textAlign: align,
        marginBottom: "var(--space-6)",
      }}
    >
      {eyebrow && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: 0 }}
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--brand)",
            marginBottom: 6,
          }}
        >
          {eyebrow}
        </motion.div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4, delay: 0.06 }}
        style={{
          fontSize: "var(--heading-1-size)",
          fontWeight: "var(--heading-1-weight)",
          lineHeight: "var(--heading-1-line-height)",
          letterSpacing: "var(--heading-1-tracking)",
          fontFamily: "var(--font-display)",
          color: "var(--text-1)",
          margin: 0,
        }}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.35, delay: 0.12 }}
          style={{
            fontSize: "var(--body-size)",
            lineHeight: "var(--body-line-height)",
            color: "var(--text-2)",
            margin: "8px 0 0",
            maxWidth: 480,
          }}
        >
          {description}
        </motion.p>
      )}
    </div>
  );
}
