"use client";

import { useEffect, useState } from "react";
import { subscribeMatch } from "@/services/matchEngine";
import { getMomentumTimeline} from "@/services/analytics/momentumTimelineEngine";
import { MomentumPoint as EngineMomentumPoint } from "@/services/analytics/momentumTimelineEngine";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  ReferenceArea
} from "recharts";
import { ReferenceDot } from "recharts";
import { getEventStream } from "@/services/matchEngine";

type Props = {
  matchId: string;
};

type ChartMomentumPoint = {
  over: number;
  momentum: number;
};

export default function MomentumChart({ matchId }: Props) {

  const [data, setData] = useState<ChartMomentumPoint[]>([]);
  useEffect(() => {

    function update() {

  const timeline = getMomentumTimeline(matchId);

  const chartData: ChartMomentumPoint[] =
    timeline.map((m: EngineMomentumPoint, index: number) => ({
      over: index,
      momentum:
  index === 0
    ? m.momentum
    : (timeline[index - 1].momentum * 0.7 +
       m.momentum * 0.3)
    }));

  setData(chartData);
}


    update();

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  const events = getEventStream(matchId);

  return (

    <div className="bg-zinc-900 p-4 rounded-xl shadow-lg">

      <h3 className="text-lg font-semibold mb-3 text-white">
        Momentum
      </h3>

      <ResponsiveContainer width="100%" height={180}>

        <LineChart data={data}>
          {events.map((e, i) => {
  if (e.runs === 4)
    return (
      <ReferenceDot
        key={`4-${i}`}
        x={i}
        y={data[Math.min(i, data.length - 1)]?.momentum ?? 0}
        r={3}
        fill="#22c55e"
      />
    );

  if (e.runs === 6)
    return (
      <ReferenceDot
        key={`6-${i}`}
        x={i}
        y={data[Math.min(i, data.length - 1)]?.momentum ?? 0}
        r={4}
        fill="#a855f7"
      />
    );

  if (e.wicket)
    return (
      <ReferenceDot
        key={`w-${i}`}
        x={i}
        y={data[Math.min(i, data.length - 1)]?.momentum ?? 0}
        r={4}
        fill="#ef4444"
      />
    );

  return null;
})}

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
      ? "#22c55e"   // green
      : data[data.length - 1].momentum < -2
      ? "#ef4444"   // red
      : "#eab308"   // yellow
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