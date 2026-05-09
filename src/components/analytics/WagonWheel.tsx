"use client";

import { useMemo } from "react";
import { useMatch } from "@/context/MatchContext";
import { BallEvent } from "@/types/ballEvent";

type Props = {
  matchId: string;
};

type Shot = {
  id: string;
  angle: number;
  runs: number;
};

function stringToSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function createMulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function getShotAngle(event: BallEvent): number {
  const key = `${event.id}|${event.batsman}|${event.over}|${event.runs}`;
  const rng = createMulberry32(stringToSeed(key));
  const rand = rng();
  const spread = rng();

  if (event.runs >= 4) {
    if (rand < 0.3) return 300 + spread * 40;
    if (rand < 0.6) return 200 + spread * 40;
    return 260 + spread * 30;
  }

  if (event.runs === 1 || event.runs === 2 || event.runs === 3) {
    return rng() * 360;
  }

  return 140 + spread * 60;
}
function getPlayerBias(player: string): number {

  const hash = player
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);

  return hash % 360;
}

export default function WagonWheel({ matchId }: Props) {
  const { state } = useMatch();
  const matchSeed = useMemo(() => stringToSeed(matchId), [matchId]);

  const events = useMemo(
    () =>
      (state?.innings ?? [])
        .flatMap((innings) =>
          Object.values(innings.overs ?? {}).flatMap((overBalls) => overBalls ?? [])
        )
        .filter((event) => event?.valid),
    [state]
  );

  const shots: Shot[] = useMemo(
    () =>
      events
        .filter((e) => e.isLegalDelivery && !e.extra)
        .map((e) => ({
          id: e.id,
          angle: (getShotAngle(e) + getPlayerBias(e.batsman) + matchSeed) % 360,
          runs: e.runs,
        })),
    [events, matchSeed]
  );

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
        {shots.map((shot) => {

          const rad = (shot.angle * Math.PI) / 180;

          const x = center + radius * Math.cos(rad);
          const y = center + radius * Math.sin(rad);

          let color = "#aaa";

          if (shot.runs === 4) color = "#22c55e"; // green
          else if (shot.runs === 6) color = "#a855f7"; // purple
          else if (shot.runs === 0) color = "#555"; // dot

          return (
            <line
              key={shot.id}
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
