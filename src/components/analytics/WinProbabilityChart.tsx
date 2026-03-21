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
  CartesianGrid,
  Area,
  ReferenceLine,
  ReferenceArea
} from "recharts";

type Props = {
  matchId: string;
  team1?: string;
  team2?: string;
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

export default function WinProbabilityChart({
  matchId,
  team1,
  team2
}: Props) {

  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {

    function update() {

      const timeline = getWinProbabilityTimeline(matchId);
      const events = getEventStream(matchId);

      if (!timeline?.timeline?.length) {
        setData([]);
        return;
      }

      const chartData: ChartPoint[] = [];

      timeline.timeline.forEach((p, index) => {

        const point: ChartPoint = {
          over: p.over,
          batting: p.batting,
          bowling: p.bowling,
          ballIndex: index
        };

        const event = events[index];

        // 🎯 Event markers
        if (event) {
          if (event.type === "WICKET") point.marker = "WICKET";
          if (event.type === "SIX") point.marker = "SIX";
          if (event.type === "FOUR") point.marker = "FOUR";
        }

        // ⚡ Swing detection
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
    return () => unsubscribe();

  }, [matchId]);

  return (
    <div className="bg-zinc-900 p-4 rounded-xl shadow-lg">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">

        <h3 className="text-sm uppercase text-gray-400">
          Win Probability
        </h3>

        {data.length > 0 && (
          <div className="text-xs flex gap-3">

            <span className="text-green-400 font-semibold">
              {team1 ?? "BAT"} {data[data.length - 1].batting.toFixed(1)}%
            </span>

            <span className="text-red-400 font-semibold">
              {team2 ?? "BOWL"} {data[data.length - 1].bowling.toFixed(1)}%
            </span>

          </div>
        )}

      </div>

      <ResponsiveContainer width="100%" height={260}>

        <LineChart
          data={data}
          onClick={(state) => {

            const payload = (
              state as {
                activePayload?: { payload: ChartPoint }[];
              }
            )?.activePayload?.[0]?.payload;

            if (!payload) return;

            window.dispatchEvent(
              new CustomEvent("timeline-seek", {
                detail: { ballIndex: payload.ballIndex }
              })
            );
          }}
        >

          {/* 🎨 GRADIENTS */}
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

          {/* 🟦 PHASE ZONES */}
          <ReferenceArea x1={0} x2={6} fill="#1e40af" fillOpacity={0.08} />
          <ReferenceArea x1={6} x2={15} fill="#065f46" fillOpacity={0.08} />
          <ReferenceArea x1={15} x2={20} fill="#7f1d1d" fillOpacity={0.08} />

          {/* GRID */}
          <CartesianGrid stroke="#333" strokeDasharray="3 3" />

          {/* AREA */}
          <Area type="monotone" dataKey="batting" fill="url(#battingFill)" stroke="none" />
          <Area type="monotone" dataKey="bowling" fill="url(#bowlingFill)" stroke="none" />

          {/* AXIS */}
          <XAxis dataKey="over" stroke="#aaa" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            stroke="#aaa"
            tickFormatter={(v) => `${v}%`}
          />

          {/* MID LINE */}
          <ReferenceLine y={50} stroke="#666" strokeDasharray="4 4" />

          {/* TOOLTIP */}
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #333",
              borderRadius: "8px"
            }}
            formatter={(value) =>
              typeof value === "number" ? `${value.toFixed(1)}%` : ""
            }
          />

          {/* MAIN LINE (BAT) */}
          <Line
            type="monotone"
            dataKey="batting"
            stroke="#22c55e"
            strokeWidth={3}
            activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
            animationDuration={800}
            animationEasing="ease-in-out"
            dot={({ cx, cy, payload }: DotProps) => {

              if (!payload?.marker || cx === undefined || cy === undefined) return null;

              let color = "#facc15";
              let label = "";

              if (payload.marker === "WICKET") {
                color = "#ef4444";
                label = "W";
              }

              if (payload.marker === "SIX") {
                color = "#22c55e";
                label = "6";
              }

              if (payload.marker === "FOUR") {
                color = "#60a5fa";
                label = "4";
              }

              if (payload.marker === "SWING") {
                label = "⚡";
              }

              return (
                <g>
                  <circle cx={cx} cy={cy} r={5} fill={color} stroke="#fff" />
                  <text
                    x={cx}
                    y={cy - 10}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#fff"
                  >
                    {label}
                  </text>
                </g>
              );
            }}
          />

          {/* BOWLING LINE */}
          <Line
            type="monotone"
            dataKey="bowling"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            animationDuration={800}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}