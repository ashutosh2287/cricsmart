"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { getMatchState } from "@/services/matchEngine";
import { computeMatchDrama } from "@/services/analytics/matchDramaEngine";

type Props = {
  matchId: string;
};

const DRAMA_LABELS = [
  { threshold: 0, label: "Calm" },
  { threshold: 20, label: "Tense" },
  { threshold: 40, label: "Heating Up" },
  { threshold: 60, label: "Intense" },
  { threshold: 80, label: "Epic Drama" },
];

function getDramaLabel(drama: number): string {
  let result = DRAMA_LABELS[0].label;
  for (const { threshold, label } of DRAMA_LABELS) {
    if (drama >= threshold) result = label;
  }
  return result;
}

function getBarColor(drama: number): string {
  if (drama >= 80) return "var(--danger)";
  if (drama >= 60) return "var(--warning, #f59e0b)";
  if (drama >= 40) return "var(--brand)";
  return "var(--text-3)";
}

export default function MatchDramaMeter({ matchId }: Props) {
  const [drama, setDrama] = useState(0);
  const [prevLabel, setPrevLabel] = useState("Calm");

  const springDrama = useSpring(drama, {
    stiffness: 100,
    damping: 12,
    mass: 0.8,
  });

  const fillWidth = useTransform(springDrama, [0, 100], ["0%", "100%"]);

  useEffect(() => {
    const interval = setInterval(() => {
      const state = getMatchState(matchId);
      if (!state) return;
      const score = computeMatchDrama(state);
      setDrama(score);
    }, 500);

    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    springDrama.set(drama);
  }, [drama, springDrama]);

  const currentLabel = getDramaLabel(drama);
  const labelChanged = currentLabel !== prevLabel;
  const isHighDrama = drama >= 60;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (labelChanged) {
      setPrevLabel(currentLabel);
    }
  }, [currentLabel, labelChanged, prevLabel]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div
      className="rounded-xl relative overflow-hidden"
      style={{
        padding: "12px",
        background: "var(--surface)",
        color: "var(--text-1)",
        width: "260px",
        border: "0.5px solid var(--border)",
      }}
    >
      {/* High drama glow */}
      <AnimatePresence>
        {isHighDrama && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.1, 0.25, 0.1],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, var(--danger) 0%, transparent 70%)`,
            }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div style={{ fontWeight: 600 }}>Match Drama</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentLabel}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: isHighDrama ? "var(--danger)" : "var(--surface-3)",
              color: isHighDrama ? "white" : "var(--text-2)",
            }}
          >
            {currentLabel}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Animated fill bar */}
      <div
        className="relative h-3 rounded-full overflow-hidden"
        style={{ background: "var(--surface-3)" }}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: fillWidth,
            background: `linear-gradient(90deg, var(--surface-3) 0%, ${getBarColor(drama)} 100%)`,
          }}
        />

        {/* Shimmer effect on high drama */}
        {isHighDrama && (
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)",
              ],
              backgroundPosition: ["200% 0", "-200% 0"],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: "200% 100%" }}
          />
        )}
      </div>

      {/* Segmented bars */}
      <div className="flex gap-[3px] mt-3 relative z-10">
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = i < Math.round(drama / 10);
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                background: filled ? getBarColor(drama) : "var(--surface-3)",
                scale: filled ? [1, 1.15, 1] : 1,
              }}
              transition={{
                duration: 0.3,
                delay: filled ? i * 0.03 : 0,
              }}
              style={{
                width: "18px",
                height: "12px",
                borderRadius: "2px",
              }}
            />
          );
        })}
      </div>

      <div className="text-xs mt-2 relative z-10" style={{ color: "var(--text-2)" }}>
        {drama.toFixed(0)}% intensity
      </div>
    </div>
  );
}
