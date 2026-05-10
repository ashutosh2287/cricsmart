"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
} from "recharts";
import { calculateMomentum, ChartMomentumPoint } from "@/services/analytics/calculateMomentum";
import AnalyticsErrorBoundary from "./AnalyticsErrorBoundary";

type MomentumPoint = {
  over: number;
  score: number;
};

type Props = {
  matchId: string;
};

function MomentumChart({ matchId }: Props) {

  const [data, setData] = useState<ChartMomentumPoint[]>([]);

  /*
  =============================
  REALTIME SSE LISTENER (FIXED)
  =============================
  */
  const handleUpdate = useCallback((e: Event) => {
      const event = e as CustomEvent;
      const payload = event.detail;

      if (!payload || payload.matchId !== matchId) return;
      if (payload.type !== "BALL_EVENT") return;

      const momentum = payload.analytics?.momentum as MomentumPoint[] | undefined;
      const chartData = calculateMomentum(momentum);
      setData(chartData);
  }, [matchId]);

  useEffect(() => {

    window.addEventListener("CRIC_UPDATE", handleUpdate);

    return () => {
      window.removeEventListener("CRIC_UPDATE", handleUpdate);
    };
  }, [handleUpdate]);

  const lineColor = useMemo(() => {
    if (!data.length) return "#3b82f6";
    const lastPoint = data[data.length - 1];
    if (lastPoint.momentum > 2) return "#22c55e";
    if (lastPoint.momentum < -2) return "#ef4444";
    return "#eab308";
  }, [data]);

  return (
    <AnalyticsErrorBoundary fallbackTitle="Momentum chart is temporarily unavailable.">
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
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
            />

          <ReferenceArea y1={2} y2={10} fill="rgba(34,197,94,0.08)" />
          <ReferenceArea y1={-2} y2={2} fill="rgba(234,179,8,0.05)" />
          <ReferenceArea y1={-10} y2={-2} fill="rgba(239,68,68,0.08)" />

        </LineChart>
      </ResponsiveContainer>
      </div>
    </AnalyticsErrorBoundary>
  );
}

const MemoizedMomentumChart = memo(MomentumChart);

MemoizedMomentumChart.displayName = "MomentumChart";
// @ts-expect-error whyDidYouRender debug flag
MemoizedMomentumChart.whyDidYouRender = true;

export default MemoizedMomentumChart;
