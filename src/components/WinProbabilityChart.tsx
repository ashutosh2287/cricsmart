"use client";

import { useEffect, useState } from "react";
import { subscribeMatch } from "@/services/matchEngine";

import {
  getProbabilityTimeline,
  ProbabilityPoint
} from "@/services/winProbabilityTimeline";

import {
  detectTurningPoints,
  TurningPoint
} from "@/services/analytics/turningPointEngine";

import { getEventStream } from "@/services/matchEngine";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot
} from "recharts";

type Props = {
  matchId: string;
};



type ChartPoint = {
  over: number;
  batting: number;
  bowling: number;
};

export default function WinProbabilityChart({ matchId }: Props) {

  const [data, setData] = useState<ChartPoint[]>([]);
  const [markers, setMarkers] = useState<TurningPoint[]>([]);

  useEffect(() => {

    const update = () => {

      const timeline: ProbabilityPoint[] =
        getProbabilityTimeline(matchId);

      if (!timeline?.length) return;

      const chartData: ChartPoint[] = timeline.map((p: ProbabilityPoint) => ({
  over: p.over,
  batting: p.battingProbability,
  bowling: p.bowlingProbability
}));

      setData(chartData);

      // turning points
      const events = getEventStream(matchId);
      const points = detectTurningPoints(events);

      setMarkers(points);

    };

    const unsubscribe = subscribeMatch(matchId, update);

    update();

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  if (!data.length) return null;
  const latest = data[data.length - 1];

  return (
    <div className="bg-gray-900 border border-gray-800 text-white p-4 rounded-xl shadow-lg">

      <div className="flex justify-between items-center mb-3">

  <h3 className="font-semibold text-gray-300 uppercase text-sm">
    Win Probability
  </h3>

  {latest && (
    <div className="text-xs text-gray-400">
      <span className="text-green-400 font-semibold">
        {latest.batting.toFixed(1)}%
      </span>
      {" / "}
      <span className="text-red-400 font-semibold">
        {latest.bowling.toFixed(1)}%
      </span>
    </div>
  )}

</div>

      <ResponsiveContainer width="100%" height={240}>

        <LineChart data={data}>

          <CartesianGrid
            stroke="#333"
            strokeDasharray="3 3"
          />

          <XAxis
  dataKey="over"
  stroke="#aaa"
/>

          <YAxis
            domain={[0, 100]}
            stroke="#aaa"
            tickFormatter={(v) => `${v}%`}
          />

          <Tooltip
            formatter={(v) =>
              typeof v === "number"
                ? `${v.toFixed(1)}%`
                : v
            }
          />

          <Line
  type="monotone"
  dataKey="batting"
  stroke="#22c55e"
  strokeWidth={3}
  dot={false}
  isAnimationActive
  animationDuration={400}
/>

<Line
  type="monotone"
  dataKey="bowling"
  stroke="#ef4444"
  strokeWidth={3}
  dot={false}
  isAnimationActive
  animationDuration={400}
/>

          {/* Turning Point Markers */}

          {markers.map((m, i) => {

            const point = data[Math.min(m.ballIndex, data.length - 1)];

            if (!point) return null;

            return (
              <ReferenceDot
                key={i}
               x={point.over}
                y={point.batting}
                r={6}
                fill="#ef4444"
              />
            );

          })}

        </LineChart>

      </ResponsiveContainer>

    </div>
  );

}