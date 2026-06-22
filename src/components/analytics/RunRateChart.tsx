"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";

type RunRatePoint = {
  over: number;
  team1Rate: number;
  team2Rate: number;
};

type Props = {
  data: RunRatePoint[];
  team1Name?: string;
  team2Name?: string;
};

function RunRateChart({ data, team1Name = "Team A", team2Name = "Team B" }: Props) {
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  if (!safeData.length) {
    return (
      <div className="theme-chart-shell rounded-xl p-4">
        <h3 className="mb-2 text-xs uppercase text-[var(--text-secondary)]">
          Run Rate Comparison
        </h3>
        <div className="text-sm text-[var(--text-secondary)]">
          No run rate data available
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="theme-chart-shell rounded-xl p-4"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm uppercase text-[var(--text-secondary)]">
          Run Rate Comparison
        </h3>
        <div className="text-xs flex gap-3">
          <span className="font-semibold text-[var(--chart-positive)]">
            {team1Name}
          </span>
          <span className="font-semibold text-[var(--chart-negative)]">
            {team2Name}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={safeData}>
          <defs>
            <linearGradient id="team1Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-positive)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-positive)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="team2Gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-negative)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-negative)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />

          <XAxis
            dataKey="over"
            stroke="var(--chart-axis)"
            tick={{ fill: "var(--text-3)", fontSize: 11 }}
          />
          <YAxis
            stroke="var(--chart-axis)"
            tick={{ fill: "var(--text-3)", fontSize: 11 }}
            tickFormatter={(v) => v.toFixed(1)}
          />

          <Tooltip
            formatter={(value, name) => [
              Number(value).toFixed(2),
              name === "team1Rate" ? team1Name : team2Name,
            ]}
            contentStyle={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: 8,
              color: "var(--text-1)",
            }}
            labelStyle={{ color: "var(--text-2)" }}
            cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
          />

          <Line
            type="monotone"
            dataKey="team1Rate"
            stroke="var(--chart-positive)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "var(--chart-positive)" }}
          />
          <Line
            type="monotone"
            dataKey="team2Rate"
            stroke="var(--chart-negative)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "var(--chart-negative)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

const MemoizedRunRateChart = memo(RunRateChart);
MemoizedRunRateChart.displayName = "RunRateChart";

export default MemoizedRunRateChart;
