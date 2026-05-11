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
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
        <h3 className="text-xs text-gray-400 uppercase mb-2">
          Player Form
        </h3>
        <div className="text-gray-500 text-sm">
          No form data
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">

      <h3 className="text-xs text-gray-400 uppercase mb-3">
        Player Form Trend
      </h3>

      <ResponsiveContainer width="100%" height={220}>

        <LineChart data={form}>

          {/* 🔥 PERFORMANCE ZONES */}
          <ReferenceArea y1={50} y2={200} fill="rgba(34,197,94,0.08)" />
          <ReferenceArea y1={20} y2={50} fill="rgba(234,179,8,0.05)" />
          <ReferenceArea y1={0} y2={20} fill="rgba(239,68,68,0.08)" />

          <XAxis dataKey="matchId" stroke="#aaa" />
          <YAxis stroke="#aaa" />

          {/* 🔥 TOOLTIP */}
          <Tooltip
            contentStyle={{ backgroundColor: "#111", border: "none" }}
            labelStyle={{ color: "#aaa" }}
          />

          <Line
            type="monotone"
            dataKey="runs"
            stroke="#22c55e"
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
