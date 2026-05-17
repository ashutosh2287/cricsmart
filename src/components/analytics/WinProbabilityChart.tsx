"use client";

import { memo, useCallback, useMemo } from "react";
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
import AnalyticsErrorBoundary from "./AnalyticsErrorBoundary";

type ChartPoint = {
  over: number;
  batting: number;
  bowling: number;
  confidence?: number;
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

function WinProbabilityChart({
  data,
  team1,
  team2
}: Props) {
  const lastPoint = useMemo(
    () => (data.length ? data[data.length - 1] : null),
    [data]
  );

  const renderMarkerDot = useCallback(({ cx, cy, payload }: DotProps) => {
    if (!payload?.marker || cx === undefined || cy === undefined) return null;

    let color = "var(--chart-marker-default)";
    let label = "";

    if (payload.marker === "TURNING_POINT") {
      label = "TP";
    } else if (payload.marker === "WICKET") {
      color = "var(--chart-negative)";
      label = "W";
    } else if (payload.marker === "SIX") {
      color = "var(--chart-positive)";
      label = "6";
    } else if (payload.marker === "FOUR") {
      color = "var(--chart-batting)";
      label = "4";
    } else if (payload.marker === "SWING") {
      label = "⚡";
    }

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={color}
          stroke="var(--chart-marker-stroke)"
        />
        <text
          x={cx}
          y={cy - 10}
          textAnchor="middle"
          fontSize="10"
          fill="var(--chart-marker-text)"
        >
          {label}
        </text>
      </g>
    );
  }, []);

  if (!lastPoint) return null;

  return (
    <AnalyticsErrorBoundary fallbackTitle="Win probability chart is temporarily unavailable.">
      <div className="theme-chart-shell rounded-xl p-4">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-3">

        <h3 className="text-sm uppercase text-[var(--text-secondary)]">
          Win Probability
        </h3>

        <div className="text-xs flex gap-3">

          <span className="font-semibold text-[var(--chart-positive)]">
            {team1 ?? "BAT"} {lastPoint.batting.toFixed(1)}%
          </span>

          <span className="font-semibold text-[var(--chart-negative)]">
            {team2 ?? "BOWL"} {lastPoint.bowling.toFixed(1)}%
          </span>

          {lastPoint.confidence !== undefined ? (
            <span className="font-semibold text-[var(--text-secondary)]">
              Confidence {(lastPoint.confidence * 100).toFixed(0)}%
            </span>
          ) : null}

        </div>

      </div>

      <ResponsiveContainer width="100%" height={260}>

        <LineChart data={data}>

          {/* GRADIENTS */}
          <defs>
            <linearGradient id="battingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-positive)" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="var(--chart-positive)" stopOpacity={0}/>
            </linearGradient>

            <linearGradient id="bowlingFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-negative)" stopOpacity={0.4}/>
              <stop offset="100%" stopColor="var(--chart-negative)" stopOpacity={0}/>
            </linearGradient>
          </defs>

          {/* PHASE ZONES */}
          <ReferenceArea x1={0} x2={6} fill="var(--chart-zone-neutral)" fillOpacity={1} />
          <ReferenceArea x1={6} x2={15} fill="var(--chart-zone-positive)" fillOpacity={1} />
          <ReferenceArea x1={15} x2={20} fill="var(--chart-zone-negative)" fillOpacity={1} />

          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />

          <Area type="monotone" dataKey="batting" fill="url(#battingFill)" stroke="none" />
          <Area type="monotone" dataKey="bowling" fill="url(#bowlingFill)" stroke="none" />

          <XAxis dataKey="over" stroke="var(--chart-axis)" />
          <YAxis domain={[0, 100]} stroke="var(--chart-axis)" tickFormatter={(v) => `${v}%`} />

          <ReferenceLine y={50} stroke="var(--chart-grid)" strokeDasharray="4 4" />

          <Tooltip
            formatter={(v) => `${Number(v).toFixed(1)}%`}
            contentStyle={{
              backgroundColor: "var(--chart-tooltip-bg)",
              border: "1px solid var(--chart-tooltip-border)",
              color: "var(--chart-tooltip-text)",
            }}
            labelStyle={{ color: "var(--text-secondary)" }}
          />

          {/* MAIN LINE */}
          <Line
            type="monotone"
            dataKey="batting"
            stroke="var(--chart-positive)"
            strokeWidth={3}
            dot={renderMarkerDot}
          />

          <Line
            type="monotone"
            dataKey="bowling"
            stroke="var(--chart-negative)"
            strokeWidth={3}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

      </div>
    </AnalyticsErrorBoundary>
  );
}

const MemoizedWinProbabilityChart = memo(WinProbabilityChart);

MemoizedWinProbabilityChart.displayName = "WinProbabilityChart";

export default MemoizedWinProbabilityChart;
