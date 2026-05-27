"use client";

import { memo, useMemo } from "react";
import { BallEvent } from "@/types/ballEvent";
import { useCurrentInningsOvers } from "@/services/matchSelectors";
import AnalyticsErrorBoundary from "./AnalyticsErrorBoundary";

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

function WagonWheel({ matchId }: Props) {
  const overs = useCurrentInningsOvers(matchId);
  const matchSeedOffset = stringToSeed(matchId) % 360;

  const events = useMemo(
    () =>
      Object.values(overs ?? {}).flatMap((overBalls) => overBalls ?? [])
        .filter((event) => event?.valid),
    [overs]
  );

  const shots: Shot[] = useMemo(
    () =>
      events
        .filter((e) => e.isLegalDelivery && !e.extra)
        .map((e) => ({
          id: e.id,
          angle: (getShotAngle(e) + getPlayerBias(e.batsman) + matchSeedOffset) % 360,
          runs: e.runs,
        })),
    [events, matchSeedOffset]
  );

  const size = 200;
  const center = size / 2;
  const radius = 80;

  return (
    <AnalyticsErrorBoundary fallbackTitle="Wagon wheel is temporarily unavailable.">
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
          else if (shot.runs === 6) color = "#ef9f27"; // accent
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
    </AnalyticsErrorBoundary>
  );
}

const MemoizedWagonWheel = memo(WagonWheel);

MemoizedWagonWheel.displayName = "WagonWheel";

export default MemoizedWagonWheel;
