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
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-xs text-gray-400 uppercase mb-2">
          Momentum Leaders
        </h3>
        <div className="text-gray-500 text-sm">
          No momentum data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">

      <h3 className="text-xs text-gray-400 uppercase mb-3">
        Momentum Leaders
      </h3>

      <ResponsiveContainer width="100%" height={220}>

        <BarChart data={data}>

          <XAxis dataKey="matchId" stroke="#aaa" />
          <YAxis stroke="#aaa" />

          {/* 🔥 UPGRADED TOOLTIP */}
          <Tooltip
            contentStyle={{ backgroundColor: "#111", border: "none" }}
            labelStyle={{ color: "#aaa" }}
          />

          <Bar dataKey="score" radius={[4, 4, 0, 0]}>

            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.score > 70
                    ? "#22c55e"   // green
                    : entry.score < 30
                    ? "#ef4444"   // red
                    : "#eab308"   // yellow
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
