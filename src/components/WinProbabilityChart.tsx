"use client";

import { useEffect, useState } from "react";
import { getMatchState, subscribeMatch } from "@/services/matchEngine";
import { computeWinProbability } from "@/services/winProbabilityEngine";

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
  ball: number;
  probability: number;
};

export default function WinProbabilityChart({ matchId }: Props) {

  const [data, setData] = useState<ChartPoint[]>([]);

  useEffect(() => {

    const update = () => {

      const state = getMatchState(matchId);
      if (!state) return;

      const prob = computeWinProbability(state);
      if (!prob) return;

      const innings = state.innings[state.currentInningsIndex];

      const ball =
        innings.over * 6 + innings.ball;

      const probability =
        prob.battingWinProbability * 100;

      setData((prev) => {

        const last = prev[prev.length - 1];

        // prevent duplicate entries for same ball
        if (last && last.ball === ball) {
          return prev;
        }

        return [
          ...prev,
          {
            ball,
            probability
          }
        ];

      });

    };

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  if (!data.length) return null;

  return (
    <div className="bg-black text-white p-4 rounded-xl">

      <h3 className="font-bold mb-2">
        Win Probability
      </h3>

      <ResponsiveContainer width="100%" height={200}>

        <LineChart data={data}>

          <CartesianGrid
            stroke="#333"
            strokeDasharray="3 3"
          />

          <XAxis
            dataKey="ball"
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
            dataKey="probability"
            stroke="#4ade80"
            strokeWidth={2}
            dot={false}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );

}