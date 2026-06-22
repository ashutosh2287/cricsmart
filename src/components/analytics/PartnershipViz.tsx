"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { stagger, slideRight } from "@/components/ui/motion";

type Partnership = {
  batsmen: [string, string];
  runs: number;
  balls: number;
  overs?: string;
};

type Props = {
  partnerships: Partnership[];
  maxRuns?: number;
};

function getBarColor(runs: number, max: number): string {
  const ratio = runs / max;
  if (ratio > 0.6) return "var(--chart-positive)";
  if (ratio > 0.3) return "var(--chart-batting)";
  return "var(--chart-neutral)";
}

function PartnershipViz({ partnerships, maxRuns }: Props) {
  const safePartnerships = useMemo(
    () => (Array.isArray(partnerships) ? partnerships : []),
    [partnerships]
  );

  const ceiling = useMemo(
    () =>
      maxRuns ?? Math.max(...safePartnerships.map((p) => p.runs), 1),
    [safePartnerships, maxRuns]
  );

  if (!safePartnerships.length) {
    return (
      <div className="theme-chart-shell rounded-xl p-4">
        <h3 className="mb-2 text-xs uppercase text-[var(--text-secondary)]">
          Partnerships
        </h3>
        <div className="text-sm text-[var(--text-secondary)]">
          No partnership data available
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="theme-chart-shell rounded-xl p-4"
    >
      <h3 className="mb-4 text-sm uppercase text-[var(--text-secondary)]">
        Batting Partnerships
      </h3>

      <div className="flex flex-col gap-3">
        {safePartnerships.map((p, i) => {
          const widthPct = Math.max((p.runs / ceiling) * 100, 4);
          const barColor = getBarColor(p.runs, ceiling);

          return (
            <motion.div
              key={`${p.batsmen[0]}-${p.batsmen[1]}-${i}`}
              variants={slideRight}
              className="flex flex-col gap-1"
            >
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--text-primary)] font-medium truncate max-w-[70%]">
                  {p.batsmen[0]} & {p.batsmen[1]}
                </span>
                <span className="text-[var(--text-secondary)]">
                  {p.runs} ({p.balls} balls)
                  {p.overs ? ` · ${p.overs}` : ""}
                </span>
              </div>

              <div className="relative h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: barColor }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

const MemoizedPartnershipViz = memo(PartnershipViz);
MemoizedPartnershipViz.displayName = "PartnershipViz";

export default MemoizedPartnershipViz;
