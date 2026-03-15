"use client";

import { useEffect, useState } from "react";
import { subscribeMatch, getEventStream } from "@/services/matchEngine";
import { getWinProbabilityTimeline } from "@/services/analytics/winProbabilityTimelineEngine";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

type Props = {
  matchId: string;
};

type ChartPoint = {
  over: number;
  batting: number;
  bowling: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING";
  ballIndex: number;
};

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
};

export default function WinProbabilityChart({ matchId }: Props) {

  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {

    function update() {

      const timeline = getWinProbabilityTimeline(matchId);
      const events = getEventStream(matchId);

      const chartData: ChartPoint[] = [];

      timeline.timeline.forEach((p, index) => {

        const point: ChartPoint = {
          over: p.over,
          batting: p.batting,
          bowling: p.bowling,
          ballIndex: index
        };

        const event = events[index];

        // Event markers
        if (event) {
          if (event.type === "WICKET") point.marker = "WICKET";
          if (event.type === "SIX") point.marker = "SIX";
          if (event.type === "FOUR") point.marker = "FOUR";
        }

        // Detect probability swing
        const prev = chartData[index - 1];

        if (!point.marker && prev) {
          const swing = Math.abs(point.batting - prev.batting);
          if (swing >= 15) {
            point.marker = "SWING";
          }
        }

        chartData.push(point);

      });

      setData(chartData);
    }

    update();

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  return (
    <div className="bg-zinc-900 p-4 rounded-xl shadow-lg">

      <h3 className="text-lg font-semibold mb-3 text-white">
        Win Probability
      </h3>

      <ResponsiveContainer width="100%" height={220}>

        <LineChart
          data={data}
          onClick={(state) => {

  const payload = (
    state as {
      activePayload?: { payload: ChartPoint }[];
    }
  )?.activePayload?.[0]?.payload;

  if (!payload) return;

  const ballIndex = payload.ballIndex;

  window.dispatchEvent(
    new CustomEvent("timeline-seek", {
      detail: { ballIndex }
    })
  );

}}
        >

          <CartesianGrid strokeDasharray="3 3" stroke="#333" />

          <XAxis
            dataKey="over"
            tick={{ fill: "#aaa", fontSize: 12 }}
          />

          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#aaa", fontSize: 12 }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="batting"
            stroke="#22c55e"
            strokeWidth={2}
            dot={({ cx, cy, payload }: DotProps) => {

              if (!payload?.marker) return null;

              let color = "#facc15"; // swing default

              if (payload.marker === "WICKET") color = "#ef4444";
              if (payload.marker === "SIX") color = "#22c55e";
              if (payload.marker === "FOUR") color = "#60a5fa";

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={5}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            }}
          />

          <Line
            type="monotone"
            dataKey="bowling"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}