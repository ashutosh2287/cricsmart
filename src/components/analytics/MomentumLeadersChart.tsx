"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import { getGlobalAnalytics } from "@/services/analytics/globalAnalyticsEngine";

export default function MomentumLeadersChart() {

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

          <Tooltip />

          <Bar
            dataKey="score"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  );

}