"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

type EventType = "boundary" | "wicket" | "runs" | null;

type Props = {
  value: string | number;
  eventType?: EventType;
};

const FLASH_COLORS: Record<string, string> = {
  boundary: "rgba(34, 197, 94, 0.5)",
  wicket: "rgba(239, 68, 68, 0.5)",
  runs: "rgba(59, 130, 246, 0.3)",
};

const GLOW_COLORS: Record<string, string> = {
  boundary: "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)",
  wicket: "0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)",
  runs: "0 0 15px rgba(59, 130, 246, 0.4)",
};

export default function AnimatedScore({ value, eventType = null }: Props) {
  const [flash, setFlash] = useState(false);
  const [glowColor, setGlowColor] = useState<string | null>(null);
  const [prevValue, setPrevValue] = useState(value);
  const [isFlipping, setIsFlipping] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (value !== prevValue) {
      setIsFlipping(true);
      setFlash(true);
      if (eventType) {
        setGlowColor(GLOW_COLORS[eventType] || GLOW_COLORS.runs);
      }

      const flashTimer = setTimeout(() => setFlash(false), 300);
      const glowTimer = setTimeout(() => setGlowColor(null), 600);
      const flipTimer = setTimeout(() => setIsFlipping(false), 400);

      setPrevValue(value);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(glowTimer);
        clearTimeout(flipTimer);
      };
    }
  }, [value, prevValue, eventType]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const displayValue = String(value).split("");

  return (
    <div className="relative inline-block">
      {/* Flash overlay */}
      <AnimatePresence>
        {flash && eventType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-lg"
            style={{
              background: FLASH_COLORS[eventType] || "transparent",
              zIndex: 0,
            }}
          />
        )}
      </AnimatePresence>

      {/* Score container with glow */}
      <div
        className="relative flex items-center overflow-hidden"
        style={{
          boxShadow: glowColor || "none",
          transition: "box-shadow 0.3s ease-out",
          borderRadius: "4px",
        }}
      >
        <AnimatePresence mode="popLayout">
          {displayValue.map((digit, i) => (
            <div key={`${value}-${i}`} className="relative overflow-hidden h-[1.2em] w-[0.7em]">
              {/* Flip clock top half */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ clipPath: "inset(0 0 50% 0)" }}
                initial={false}
                animate={isFlipping ? { rotateX: [0, -90, 0] } : {}}
                transition={{
                  duration: 0.4,
                  delay: i * 0.05,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <motion.span
                  key={`top-${value}-${i}`}
                  className="inline-block text-xl font-bold leading-none"
                  style={{ color: "var(--text-1)" }}
                  initial={{ opacity: 0.7, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  {digit}
                </motion.span>
              </motion.div>

              {/* Flip clock bottom half */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                style={{ clipPath: "inset(50% 0 0 0)" }}
                initial={false}
                animate={isFlipping ? { rotateX: [0, 90, 0] } : {}}
                transition={{
                  duration: 0.4,
                  delay: i * 0.05,
                  ease: [0.4, 0, 0.2, 1],
                }}
              >
                <motion.span
                  key={`bot-${value}-${i}`}
                  className="inline-block text-xl font-bold leading-none"
                  style={{ color: "var(--text-1)" }}
                  initial={{ opacity: 0.7, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  {digit}
                </motion.span>
              </motion.div>

              {/* Center divider line */}
              <div
                className="absolute left-0 right-0 h-px z-10"
                style={{
                  top: "50%",
                  background: "var(--border)",
                  opacity: 0.3,
                }}
              />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* Glow ring effect */}
      <AnimatePresence>
        {glowColor && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-[-8px] rounded-lg pointer-events-none"
            style={{
              boxShadow: glowColor,
              zIndex: -1,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
