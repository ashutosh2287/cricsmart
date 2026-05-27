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

    <div
      className="p-4 rounded-xl"
      style={{ background: "var(--surface)", border: "0.5px solid var(--border)", color: "var(--text-1)" }}
    >

      <h3 className="font-bold mb-2">
        Momentum
      </h3>

      <div className="w-full h-4 rounded overflow-hidden" style={{ background: "var(--surface-3)" }}>

        <div
          className="h-full transition-all"
          style={{ width: `${momentum}%`, background: "var(--brand)" }}
        />

      </div>

      <div className="text-sm mt-1">

        Batting {momentum.toFixed(0)}% — Bowling {(100 - momentum).toFixed(0)}%

      </div>

    </div>

  );

}
