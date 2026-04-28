"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceDot
} from "recharts";

type MomentumPoint = {
  over: number;
  score: number;
};

type Props = {
  matchId: string;
};

type ChartMomentumPoint = {
  over: number;
  momentum: number;
};

export default function MomentumChart({ matchId }: Props) {

  const [data, setData] = useState<ChartMomentumPoint[]>([]);

  /*
  =============================
  REALTIME SSE LISTENER (FIXED)
  =============================
  */
  useEffect(() => {
    function handleUpdate(e: Event) {
      const event = e as CustomEvent;
      const payload = event.detail;

      if (!payload || payload.matchId !== matchId) return;
      if (payload.type !== "BALL_EVENT") return;

      const momentum = payload.analytics?.momentum;

      if (!momentum || !Array.isArray(momentum)) return;
      const chartData = (momentum as MomentumPoint[]).map((m, index) => ({
        over: index,
        momentum: m.score,
      }));

      setData(chartData);
    }

    window.addEventListener("CRIC_UPDATE", handleUpdate);

    return () => {
      window.removeEventListener("CRIC_UPDATE", handleUpdate);
    };
  }, [matchId]);

  return (
    <div className="bg-zinc-900 p-4 rounded-xl shadow-lg">

      <h3 className="text-lg font-semibold mb-3 text-white">
        Momentum
      </h3>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" stroke="#333" />

          <XAxis
            dataKey="over"
            tick={{ fill: "#aaa", fontSize: 12 }}
          />

          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "#aaa", fontSize: 12 }}
          />

          <Tooltip
            contentStyle={{ backgroundColor: "#111", border: "none" }}
            labelStyle={{ color: "#aaa" }}
            cursor={{ stroke: "#444", strokeWidth: 1 }}
          />

          <Line
            type="monotone"
            dataKey="momentum"
            stroke={
              data.length
                ? data[data.length - 1].momentum > 2
                  ? "#22c55e"
                  : data[data.length - 1].momentum < -2
                  ? "#ef4444"
                  : "#eab308"
                : "#3b82f6"
            }
            strokeWidth={2}
            dot={false}
          />

          <ReferenceArea y1={2} y2={10} fill="rgba(34,197,94,0.08)" />
          <ReferenceArea y1={-2} y2={2} fill="rgba(234,179,8,0.05)" />
          <ReferenceArea y1={-10} y2={-2} fill="rgba(239,68,68,0.08)" />

        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}