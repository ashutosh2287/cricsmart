"use client";

import { useEffect, useState } from "react";
import { computeMomentumMeter } from "@/services/momentumMeterEngine";
import { subscribeMatch } from "@/services/matchEngine";

type Props = {
  matchId: string;
};

export default function MomentumMeter({ matchId }: Props) {

  const [momentum, setMomentum] = useState<number>(50);

  useEffect(() => {

    const update = () => {
      const value = computeMomentumMeter(matchId);
      setMomentum(value);
    };

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };

  }, [matchId]);

  return (

    <div className="bg-black text-white p-4 rounded-xl">

      <h3 className="font-bold mb-2">
        Momentum
      </h3>

      <div className="w-full h-4 bg-gray-700 rounded overflow-hidden">

        <div
          className="h-full bg-green-400 transition-all"
          style={{ width: `${momentum}%` }}
        />

      </div>

      <div className="text-sm mt-1">

        Batting {momentum.toFixed(0)}% — Bowling {(100 - momentum).toFixed(0)}%

      </div>

    </div>

  );

}