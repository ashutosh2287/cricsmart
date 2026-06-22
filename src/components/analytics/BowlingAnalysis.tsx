"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type BowlingStats = {
  economy: number;
  strikeRate: number;
  dotBallPct: number;
  wickets: number;
  average?: number;
};

type BowlerEntry = {
  name: string;
  stats: BowlingStats;
};

type Props = {
  bowlers: BowlerEntry[];
};

const AXIS_KEYS = [
  { key: "economy", label: "Economy" },
  { key: "strikeRate", label: "Strike Rate" },
  { key: "dotBallPct", label: "Dot Ball %" },
  { key: "wickets", label: "Wickets" },
] as const;

const COLORS = [
  "var(--chart-positive)",
  "var(--chart-negative)",
  "var(--chart-batting)",
  "var(--chart-neutral)",
];

function normalizeStats(stats: BowlingStats) {
  return AXIS_KEYS.map(({ key, label }) => ({
    axis: label,
    value: stats[key as keyof BowlingStats] ?? 0,
  }));
}

function BowlingAnalysis({ bowlers }: Props) {
  const safeBowlers = useMemo(
    () => (Array.isArray(bowlers) ? bowlers : []),
    [bowlers]
  );

  if (!safeBowlers.length) {
    return (
      <div className="theme-chart-shell rounded-xl p-4">
        <h3 className="mb-2 text-xs uppercase text-[var(--text-secondary)]">
          Bowling Analysis
        </h3>
        <div className="text-sm text-[var(--text-secondary)]">
          No bowling data available
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="theme-chart-shell rounded-xl p-4"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm uppercase text-[var(--text-secondary)]">
          Bowling Analysis
        </h3>
        <div className="text-xs flex gap-3 flex-wrap">
          {safeBowlers.map((b, i) => (
            <span
              key={b.name}
              className="font-semibold"
              style={{ color: COLORS[i % COLORS.length] }}
            >
              {b.name}
            </span>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={normalizeStats(safeBowlers[0].stats)}>
          <PolarGrid stroke="var(--chart-grid)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--text-3)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            tick={{ fill: "var(--text-3)", fontSize: 10 }}
            stroke="var(--chart-axis)"
          />

          {safeBowlers.map((b, i) => {
            const color = COLORS[i % COLORS.length];
            return (
              <Radar
                key={b.name}
                name={b.name}
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            );
          })}

          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-1)",
            }}
            labelStyle={{ color: "var(--text-2)" }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

const MemoizedBowlingAnalysis = memo(BowlingAnalysis);
MemoizedBowlingAnalysis.displayName = "BowlingAnalysis";

export default MemoizedBowlingAnalysis;
