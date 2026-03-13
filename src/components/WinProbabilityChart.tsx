"use client";

import { useEffect, useState } from "react";
import { subscribeMatch, getEventStream } from "@/services/matchEngine";

import {
  getProbabilityTimeline,
  ProbabilityPoint
} from "@/services/winProbabilityTimeline";

import {
  detectTurningPoints,
  TurningPoint
} from "@/services/analytics/turningPointEngine";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  Area
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

      const chartData: ChartPoint[] = timeline.map((p) => ({
        over: p.over,
        batting: p.battingProbability,
        bowling: p.bowlingProbability
      }));

      setData(chartData);

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

      {/* Header */}

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

          <defs>

            <linearGradient id="battingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0}/>
            </linearGradient>

            <linearGradient id="bowlingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>

          </defs>

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

          {/* Neutral 50% line */}

          <ReferenceLine
            y={50}
            stroke="#666"
            strokeDasharray="4 4"
          />

          <Tooltip
            formatter={(v) =>
              typeof v === "number"
                ? `${v.toFixed(1)}%`
                : v
            }
          />

          {/* Area shading */}

          <Area
            type="monotone"
            dataKey="batting"
            stroke="none"
            fill="url(#battingFill)"
          />

          <Area
            type="monotone"
            dataKey="bowling"
            stroke="none"
            fill="url(#bowlingFill)"
          />

          {/* Probability lines */}

          <Line
            type="monotone"
            dataKey="batting"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
            animationDuration={500}
          />

          <Line
            type="monotone"
            dataKey="bowling"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            animationDuration={500}
          />

          {/* Turning Point Markers */}

          {markers.map((m, i) => {

            const point =
              data[Math.min(m.ballIndex, data.length - 1)];

            if (!point) return null;

            return (
              <ReferenceDot
                key={i}
                x={point.over}
                y={point.batting}
                r={6}
                fill="#facc15"
                stroke="#000"
              />
            );

          })}

        </LineChart>

      </ResponsiveContainer>

    </div>
  );

}