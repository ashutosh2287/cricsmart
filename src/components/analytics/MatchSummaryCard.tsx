"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { stagger, springGentle } from "@/components/ui/motion";

type MatchSummary = {
  result: string;
  topScorer: { name: string; runs: number; balls?: number };
  bestBowler: { name: string; wickets: number; economy?: number };
  venue?: string;
  date?: string;
};

type Props = {
  summary: MatchSummary;
};

function MatchSummaryCard({ summary }: Props) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="relative rounded-xl p-5 overflow-hidden"
      style={{
        background: "rgba(var(--bg-surface-rgb, 255, 255, 255), 0.6)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, var(--brand) 0%, transparent 50%, var(--chart-positive) 100%)",
        }}
      />

      <motion.h3
        variants={springGentle}
        className="relative text-sm uppercase text-[var(--text-secondary)] mb-4"
      >
        Match Summary
      </motion.h3>

      <motion.p
        variants={springGentle}
        className="relative text-lg font-bold text-[var(--text-primary)] mb-4 leading-snug"
      >
        {summary.result}
      </motion.p>

      <motion.div variants={stagger} className="relative flex flex-col gap-3">
        <motion.div
          variants={springGentle}
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ background: "var(--surface)" }}
        >
          <div>
            <div className="text-xs text-[var(--text-secondary)]">Top Scorer</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {summary.topScorer.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[var(--chart-positive)]">
              {summary.topScorer.runs}
              {summary.topScorer.balls !== undefined && (
                <span className="text-xs font-normal text-[var(--text-secondary)]">
                  {" "}({summary.topScorer.balls})
                </span>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={springGentle}
          className="flex items-center justify-between rounded-lg px-3 py-2"
          style={{ background: "var(--surface)" }}
        >
          <div>
            <div className="text-xs text-[var(--text-secondary)]">Best Bowler</div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">
              {summary.bestBowler.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[var(--chart-negative)]">
              {summary.bestBowler.wickets} wkt
              {summary.bestBowler.economy !== undefined && (
                <span className="text-xs font-normal text-[var(--text-secondary)]">
                  {" "}(@ {summary.bestBowler.economy.toFixed(1)})
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {(summary.venue || summary.date) && (
        <motion.div
          variants={springGentle}
          className="relative mt-4 flex gap-4 text-xs text-[var(--text-secondary)]"
        >
          {summary.venue && <span>{summary.venue}</span>}
          {summary.date && <span>{summary.date}</span>}
        </motion.div>
      )}
    </motion.div>
  );
}

const MemoizedMatchSummaryCard = memo(MatchSummaryCard);
MemoizedMatchSummaryCard.displayName = "MatchSummaryCard";

export default MemoizedMatchSummaryCard;
