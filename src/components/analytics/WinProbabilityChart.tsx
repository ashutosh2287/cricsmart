"use client";

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

type ChartPoint = {
  over: number;
  batting: number;
  bowling: number;
  marker?: "WICKET" | "SIX" | "FOUR" | "SWING" | "TURNING_POINT";
};

type Props = {
  data: ChartPoint[];
  team1?: string;
  team2?: string;
};

type DotProps = {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
};

export default function WinProbabilityChart({
  data,
  team1,
  team2
}: Props) {

  if (!data.length) return null;

  return (
    <div className="bg-zinc-900 p-4 rounded-xl shadow-lg">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">

        <h3 className="text-sm uppercase text-gray-400">
          Win Probability
        </h3>

        <div className="text-xs flex gap-3">

          <span className="text-green-400 font-semibold">
            {team1 ?? "BAT"} {data[data.length - 1].batting.toFixed(1)}%
          </span>

          <span className="text-red-400 font-semibold">
            {team2 ?? "BOWL"} {data[data.length - 1].bowling.toFixed(1)}%
          </span>

        </div>

      </div>

      <ResponsiveContainer width="100%" height={260}>

        <LineChart data={data}>

          {/* GRADIENTS */}
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

          {/* PHASE ZONES */}
          <ReferenceArea x1={0} x2={6} fill="#1e40af" fillOpacity={0.08} />
          <ReferenceArea x1={6} x2={15} fill="#065f46" fillOpacity={0.08} />
          <ReferenceArea x1={15} x2={20} fill="#7f1d1d" fillOpacity={0.08} />

          <CartesianGrid stroke="#333" strokeDasharray="3 3" />

          <Area type="monotone" dataKey="batting" fill="url(#battingFill)" stroke="none" />
          <Area type="monotone" dataKey="bowling" fill="url(#bowlingFill)" stroke="none" />

          <XAxis dataKey="over" stroke="#aaa" />
          <YAxis domain={[0, 100]} stroke="#aaa" tickFormatter={(v) => `${v}%`} />

          <ReferenceLine y={50} stroke="#666" strokeDasharray="4 4" />

          <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />

          {/* MAIN LINE */}
          <Line
            type="monotone"
            dataKey="batting"
            stroke="#22c55e"
            strokeWidth={3}
            dot={({ cx, cy, payload }: DotProps) => {
              if (!payload?.marker || cx === undefined || cy === undefined) return null;

              let color = "#facc15";
              let label = "";

              if (payload.marker === "TURNING_POINT") {
                label = "TP";
              } else if (payload.marker === "WICKET") {
                color = "#ef4444";
                label = "W";
              } else if (payload.marker === "SIX") {
                color = "#22c55e";
                label = "6";
              } else if (payload.marker === "FOUR") {
                color = "#60a5fa";
                label = "4";
              } else if (payload.marker === "SWING") {
                label = "⚡";
              }

              return (
                <g>
                  <circle cx={cx} cy={cy} r={6} fill={color} stroke="#fff" />
                  <text x={cx} y={cy - 10} textAnchor="middle" fontSize="10" fill="#fff">
                    {label}
                  </text>
                </g>
              );
            }}
          />

          <Line
            type="monotone"
            dataKey="bowling"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}