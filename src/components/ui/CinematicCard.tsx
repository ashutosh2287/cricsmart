"use client";

import { motion } from "framer-motion";
import { cardReveal, cardHover } from "./motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "cyan" | "purple" | "green" | "none";
  padding?: string;
};

const glowStyles = {
  cyan: "border-[rgba(0,229,255,0.15)] hover:border-[rgba(0,229,255,0.3)] hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]",
  purple: "border-[rgba(124,58,237,0.15)] hover:border-[rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]",
  green: "border-[rgba(0,255,135,0.15)] hover:border-[rgba(0,255,135,0.3)] hover:shadow-[0_0_20px_rgba(0,255,135,0.15)]",
  none: "",
};

export default function CinematicCard({
  children,
  className = "",
  hover = true,
  glow = "none",
  padding = "p-5",
}: Props) {
  const Component = hover ? motion.div : "div";
  const motionProps = hover
    ? { variants: cardHover, initial: "rest", whileHover: "hover", whileTap: "tap" }
    : {};

  return (
    <Component
      {...motionProps}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] transition-all duration-300 ${padding} ${glowStyles[glow]} ${className}`}
    >
      {children}
    </Component>
  );
}
