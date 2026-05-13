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
    if (!data.length) return "var(--chart-batting)";
    const lastPoint = data[data.length - 1];
    if (lastPoint.momentum > 2) return "var(--chart-positive)";
    if (lastPoint.momentum < -2) return "var(--chart-negative)";
    return "var(--chart-neutral)";
  }, [data]);

  return (
    <AnalyticsErrorBoundary fallbackTitle="Momentum chart is temporarily unavailable.">
      <div className="theme-chart-shell rounded-xl p-4">

      <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
        Momentum
      </h3>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />

            <XAxis
              dataKey="over"
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            />

            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "var(--chart-axis)", fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "var(--chart-tooltip-bg)",
                border: "1px solid var(--chart-tooltip-border)",
              }}
              labelStyle={{ color: "var(--text-secondary)" }}
              cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
            />

            <Line
              type="monotone"
              dataKey="momentum"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
            />

          <ReferenceArea y1={2} y2={10} fill="var(--chart-zone-positive)" />
          <ReferenceArea y1={-2} y2={2} fill="var(--chart-zone-neutral)" />
          <ReferenceArea y1={-10} y2={-2} fill="var(--chart-zone-negative)" />

        </LineChart>
      </ResponsiveContainer>
      </div>
    </AnalyticsErrorBoundary>
  );
}

const MemoizedMomentumChart = memo(MomentumChart);

MemoizedMomentumChart.displayName = "MomentumChart";

export default MemoizedMomentumChart;
