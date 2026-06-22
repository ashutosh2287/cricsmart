"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { stagger } from "@/components/ui/motion";

type WicketFall = {
  wicketNumber: number;
  batsman: string;
  score: string;
  overs: string;
  runsScored: number;
};

type Props = {
  wickets: WicketFall[];
};

function FallOfWicketsTimeline({ wickets }: Props) {
  const safeWickets = useMemo(
    () => (Array.isArray(wickets) ? wickets : []),
    [wickets]
  );

  if (!safeWickets.length) {
    return (
      <div className="theme-chart-shell rounded-xl p-4">
        <h3 className="mb-2 text-xs uppercase text-[var(--text-secondary)]">
          Fall of Wickets
        </h3>
        <div className="text-sm text-[var(--text-secondary)]">
          No wickets to display
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="theme-chart-shell rounded-xl p-4"
    >
      <h3 className="mb-4 text-sm uppercase text-[var(--text-secondary)]">
        Fall of Wickets
      </h3>

      <div className="relative">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-0"
        >
          {safeWickets.map((w, i) => (
            <motion.div
              key={w.wicketNumber}
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
                },
              }}
              className="relative flex items-start gap-4"
            >
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 15 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[var(--surface)] z-10"
                  style={{ background: "var(--chart-negative)" }}
                >
                  {w.wicketNumber}
                </motion.div>
                {i < safeWickets.length - 1 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "100%" }}
                    transition={{ delay: i * 0.08 + 0.15, duration: 0.3 }}
                    className="w-px bg-[var(--border-med)]"
                    style={{ minHeight: 32 }}
                  />
                )}
              </div>

              <div className="pb-4 pt-1">
                <div className="text-sm font-semibold text-[var(--text-primary)]">
                  {w.batsman}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Score: {w.score} · Overs: {w.overs}
                  {w.runsScored !== undefined && ` · Made ${w.runsScored}`}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

const MemoizedFallOfWicketsTimeline = memo(FallOfWicketsTimeline);
MemoizedFallOfWicketsTimeline.displayName = "FallOfWicketsTimeline";

export default MemoizedFallOfWicketsTimeline;
