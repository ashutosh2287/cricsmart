"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeConfig = {
  sm: { icon: "w-6 h-6", text: "text-base" },
  md: { icon: "w-8 h-8", text: "text-xl" },
  lg: { icon: "w-12 h-12", text: "text-3xl" },
};

export default function AnimatedLogo({ size = "md", className = "" }: AnimatedLogoProps) {
  const config = sizeConfig[size];

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <motion.div
        whileHover={{
          scale: 1.15,
          rotate: 5,
          boxShadow: "0 0 20px rgba(0, 229, 255, 0.4), 0 0 40px rgba(0, 229, 255, 0.2)",
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="relative"
      >
        <img src="/logo-icon.svg" alt="" className={config.icon} />
        {/* Glow ring on hover */}
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{
            background: "radial-gradient(circle, rgba(0,229,255,0.15) 0%, transparent 70%)",
            transform: "scale(1.8)",
          }}
        />
      </motion.div>

      <motion.span
        className={`font-bold ${config.text}`}
        style={{ fontFamily: "var(--font-display)" }}
        whileHover={{ letterSpacing: "0.02em" }}
        transition={{ duration: 0.2 }}
      >
        <span className="text-[var(--brand)]">Cric</span>
        <motion.span
          className="text-[var(--text-1)]"
          whileHover={{
            textShadow: "0 0 12px rgba(0, 229, 255, 0.5)",
          }}
        >
          Lens
        </motion.span>
      </motion.span>
    </Link>
  );
}
