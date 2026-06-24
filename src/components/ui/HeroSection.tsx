"use client";

import { motion } from "framer-motion";
import { heroReveal, heroStagger, heroChild } from "./motion";

type Props = {
  eyebrow?: string;
  title: string;
  titleGradient?: boolean;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
};

export default function HeroSection({
  eyebrow,
  title,
  titleGradient = true,
  subtitle,
  children,
  className = "",
}: Props) {
  return (
    <motion.section
      variants={heroStagger}
      initial="hidden"
      animate="visible"
      className={`relative py-16 md:py-24 ${className}`}
    >
      <div className="gradient-mesh absolute inset-0 -z-10 rounded-2xl" />

      <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
        {eyebrow && (
          <motion.div variants={heroChild} className="mb-4">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-[rgba(0,229,255,0.08)] text-[var(--brand)] border border-[rgba(0,229,255,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
              {eyebrow}
            </span>
          </motion.div>
        )}

        <motion.h1
          variants={heroChild}
          className={`text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6 ${titleGradient ? "gradient-text" : "text-[var(--text-1)]"}`}
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            variants={heroChild}
            className="text-lg md:text-xl text-[var(--text-2)] max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div variants={heroChild}>
            {children}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
