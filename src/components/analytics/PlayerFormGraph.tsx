"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { getPlayerForm } from "@/services/analytics/playerFormEngine";

type Props = {
  playerId: string;
};

export default function PlayerFormGraph({ playerId }: Props) {

  const form = getPlayerForm(playerId);

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

          <XAxis dataKey="matchId" stroke="#aaa" />

          <YAxis stroke="#aaa" />

          <Tooltip />

          <Line
            dataKey="runs"
            stroke="#22c55e"
            strokeWidth={3}
            dot
          />

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}