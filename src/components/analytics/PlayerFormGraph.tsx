"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from "recharts";
import { memo, useMemo } from "react";

import { getPlayerForm } from "@/services/analytics/playerFormEngine";

type Props = {
  playerId: string;
};

function PlayerFormGraph({ playerId }: Props) {

  const form = useMemo(() => getPlayerForm(playerId), [playerId]);

  if (!form.length) {
    return (
      <div className="theme-chart-shell rounded-xl p-4">
        <h3 className="mb-2 text-xs uppercase text-[var(--text-secondary)]">
          Player Form
        </h3>
        <div className="text-sm text-[var(--text-secondary)]">
          No form data
        </div>
      </div>
    );
  }

  return (
    <div className="theme-chart-shell rounded-xl p-4">

      <h3 className="mb-3 text-xs uppercase text-[var(--text-secondary)]">
        Player Form Trend
      </h3>

      <ResponsiveContainer width="100%" height={220}>

        <LineChart data={form}>

          {/* 🔥 PERFORMANCE ZONES */}
          <ReferenceArea y1={50} y2={200} fill="var(--chart-zone-positive)" />
          <ReferenceArea y1={20} y2={50} fill="var(--chart-zone-neutral)" />
          <ReferenceArea y1={0} y2={20} fill="var(--chart-zone-negative)" />

          <XAxis dataKey="matchId" stroke="var(--chart-axis)" />
          <YAxis stroke="var(--chart-axis)" />

          {/* 🔥 TOOLTIP */}
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border)",
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />

          <Line
            type="monotone"
            dataKey="runs"
            stroke="var(--chart-positive)"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}

const MemoizedPlayerFormGraph = memo(PlayerFormGraph);

MemoizedPlayerFormGraph.displayName = "PlayerFormGraph";

export default MemoizedPlayerFormGraph;
