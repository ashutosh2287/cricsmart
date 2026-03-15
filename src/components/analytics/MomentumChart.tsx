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
  Tooltip
} from "recharts";

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
      momentum: m.momentum
    }));

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
            domain={[-10, 10]}
            tick={{ fill: "#aaa", fontSize: 12 }}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="momentum"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}