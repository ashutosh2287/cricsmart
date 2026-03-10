"use client";

import { useEffect, useState } from "react";
import { getMatchState } from "@/services/matchEngine";
import { computeMatchDrama } from "@/services/analytics/matchDramaEngine";

type Props = {
  matchId: string;
};

export default function MatchDramaMeter({ matchId }: Props) {

  const [drama, setDrama] = useState(0);

  useEffect(() => {

    const interval = setInterval(() => {

      const state = getMatchState(matchId);

      if (!state) return;

      const score = computeMatchDrama(state);

      setDrama(score);

    }, 500);

    return () => clearInterval(interval);

  }, [matchId]);

  const bars = Math.round(drama / 10);

  return (
    <div
      style={{
        padding: "12px",
        background: "#111",
        color: "white",
        borderRadius: "8px",
        width: "260px"
      }}
    >

      <div style={{ marginBottom: "8px", fontWeight: 600 }}>
        Match Drama
      </div>

      <div style={{ display: "flex", gap: "3px" }}>
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: "18px",
              height: "12px",
              background:
                i < bars ? "#ff3b3b" : "#444",
              borderRadius: "2px"
            }}
          />
        ))}
      </div>

      <div style={{ marginTop: "6px", fontSize: "12px" }}>
        {drama}% intensity
      </div>

    </div>
  );
}