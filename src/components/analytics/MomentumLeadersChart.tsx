"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { memo } from "react";

import { getGlobalAnalytics } from "@/services/analytics/globalAnalyticsEngine";

function MomentumLeadersChart() {

  const data = getGlobalAnalytics().momentumLeaders;

  if (!data.length) {
    return (
      <div className="theme-chart-shell rounded-xl p-4">
        <h3 className="mb-2 text-xs uppercase text-[var(--text-secondary)]">
          Momentum Leaders
        </h3>
        <div className="text-sm text-[var(--text-secondary)]">
          No momentum data yet
        </div>
      </div>
    );
  }

  return (
    <div className="theme-chart-shell rounded-xl p-4">

      <h3 className="mb-3 text-xs uppercase text-[var(--text-secondary)]">
        Momentum Leaders
      </h3>

      <ResponsiveContainer width="100%" height={220}>

        <BarChart data={data}>

          <XAxis dataKey="matchId" stroke="var(--chart-axis)" tick={{ fill: "var(--text-3)", fontSize: 11 }} />
          <YAxis stroke="var(--chart-axis)" tick={{ fill: "var(--text-3)", fontSize: 11 }} />

          {/* 🔥 UPGRADED TOOLTIP */}
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border)",
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />

          <Bar dataKey="score" radius={[4, 4, 0, 0]}>

            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.score > 70
                    ? "var(--chart-positive)"
                    : entry.score < 30
                    ? "var(--chart-negative)"
                    : "var(--chart-neutral)"
                }
              />
            ))}

          </Bar>

        </BarChart>

      </ResponsiveContainer>

    </div>
  );
}

const MemoizedMomentumLeadersChart = memo(MomentumLeadersChart);

MemoizedMomentumLeadersChart.displayName = "MomentumLeadersChart";

export default MemoizedMomentumLeadersChart;
