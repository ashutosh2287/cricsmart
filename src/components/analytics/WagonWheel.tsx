"use client";

import { getEventStream } from "@/services/matchEngine";

type Props = {
  matchId: string;
};

type Shot = {
  angle: number;
  runs: number;
};

function getShotAngle(runs: number): number {

  // 🔥 Weighted realistic distribution

  const rand = Math.random();

  // Boundaries → aggressive zones
  if (runs >= 4) {

    if (rand < 0.3) return 300 + Math.random() * 40; // cover
    if (rand < 0.6) return 200 + Math.random() * 40; // midwicket
    return 260 + Math.random() * 30; // straight
  }

  // singles → gaps
  if (runs === 1 || runs === 2) {
    return Math.random() * 360;
  }

  // dots → defensive
  return 140 + Math.random() * 60; // behind square
}
function getPlayerBias(player: string): number {

  const hash = player
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return hash % 360;
}

export default function WagonWheel({ matchId }: Props) {

  const events = getEventStream(matchId);

  const shots: Shot[] = events
    .filter(e => e.isLegalDelivery && !e.extra)
    .map(e => ({
      angle: (getShotAngle(e.runs) + getPlayerBias(e.batsman)) % 360,
      runs: e.runs
    }));

  const size = 200;
  const center = size / 2;
  const radius = 80;

  return (
    <div className="bg-zinc-900 p-4 rounded-xl shadow-lg">

      <h3 className="text-lg font-semibold mb-3 text-white">
        Wagon Wheel
      </h3>
      

      <svg width={size} height={size} className="mx-auto">

        {/* Pitch */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="rgba(255,255,255,0.02)"
          stroke="#333"
        />

        {/* Shots */}
        {shots.map((shot, i) => {

          const rad = (shot.angle * Math.PI) / 180;

          const x = center + radius * Math.cos(rad);
          const y = center + radius * Math.sin(rad);

          let color = "#aaa";

          if (shot.runs === 4) color = "#22c55e"; // green
          else if (shot.runs === 6) color = "#a855f7"; // purple
          else if (shot.runs === 0) color = "#555"; // dot

          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={color}
              strokeWidth={
  shot.runs === 6 ? 4 :
  shot.runs === 4 ? 3 :
  1
}
              opacity={shot.runs === 0 ? 0.3 : 0.9}
            />
          );
        })}

        {/* Center */}
        <circle cx={center} cy={center} r={3} fill="#fff" />

      </svg>

    </div>
  );
}