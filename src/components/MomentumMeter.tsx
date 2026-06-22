"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { computeMomentumMeter } from "@/services/momentumMeterEngine";
import { subscribeMatch } from "@/services/matchEngine";

type Props = {
  matchId: string;
};

const NEEDLE_LENGTH = 70;
const GAUGE_RADIUS = 90;
const CENTER_X = 100;
const CENTER_Y = 100;

function momentumToAngle(value: number): number {
  return (value / 100) * 180 - 90;
}

function getMomentumColor(value: number): string {
  if (value >= 60) return "var(--brand)";
  if (value >= 40) return "var(--text-2)";
  return "var(--danger)";
}

export default function MomentumMeter({ matchId }: Props) {
  const [momentum, setMomentum] = useState<number>(50);
  const [prevMomentum, setPrevMomentum] = useState<number>(50);
  const [pulsing, setPulsing] = useState(false);

  const springValue = useSpring(momentum, {
    stiffness: 80,
    damping: 15,
    mass: 1,
  });

  const needleAngle = useTransform(springValue, [0, 100], [-90, 90]);
  const needleX = useTransform(needleAngle, (angle) => {
    const rad = (angle * Math.PI) / 180;
    return CENTER_X + Math.cos(rad) * NEEDLE_LENGTH;
  });
  const needleY = useTransform(needleAngle, (angle) => {
    const rad = (angle * Math.PI) / 180;
    return CENTER_Y + Math.sin(rad) * NEEDLE_LENGTH;
  });

  useEffect(() => {
    const update = () => {
      const value = computeMomentumMeter(matchId);
      setPrevMomentum(momentum);
      setMomentum(value);

      if (Math.abs(value - momentum) > 10) {
        setPulsing(true);
        setTimeout(() => setPulsing(false), 600);
      }
    };

    const unsubscribe = subscribeMatch(matchId, update);

    return () => {
      unsubscribe();
    };
  }, [matchId, momentum]);

  useEffect(() => {
    springValue.set(momentum);
  }, [momentum, springValue]);

  const arcPath = (startAngle: number, endAngle: number, radius: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = CENTER_X + Math.cos(startRad) * radius;
    const y1 = CENTER_Y + Math.sin(startRad) * radius;
    const x2 = CENTER_X + Math.cos(endRad) * radius;
    const y2 = CENTER_Y + Math.sin(endRad) * radius;
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div
      className="p-4 rounded-xl relative"
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        color: "var(--text-1)",
      }}
    >
      <h3 className="font-bold mb-2 text-center">Momentum</h3>

      <svg
        viewBox="0 0 200 130"
        className="w-full max-w-[240px] mx-auto"
        style={{ filter: pulsing ? "drop-shadow(0 0 12px var(--brand))" : "none" }}
      >
        {/* Background arc segments */}
        <path
          d={arcPath(-90, -30, GAUGE_RADIUS)}
          fill="none"
          stroke="var(--danger)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d={arcPath(-30, 30, GAUGE_RADIUS)}
          fill="none"
          stroke="var(--text-2)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <path
          d={arcPath(30, 90, GAUGE_RADIUS)}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Active arc */}
        <motion.path
          d={arcPath(-90, momentumToAngle(momentum), GAUGE_RADIUS)}
          fill="none"
          stroke={getMomentumColor(momentum)}
          strokeWidth="8"
          strokeLinecap="round"
          initial={false}
          animate={{ opacity: 0.9 }}
        />

        {/* Tick marks */}
        {Array.from({ length: 11 }).map((_, i) => {
          const angle = (i / 10) * 180 - 90;
          const rad = (angle * Math.PI) / 180;
          const innerR = GAUGE_RADIUS - 14;
          const outerR = GAUGE_RADIUS - 6;
          return (
            <line
              key={i}
              x1={CENTER_X + Math.cos(rad) * innerR}
              y1={CENTER_Y + Math.sin(rad) * innerR}
              x2={CENTER_X + Math.cos(rad) * outerR}
              y2={CENTER_Y + Math.sin(rad) * outerR}
              stroke="var(--text-3)"
              strokeWidth={i % 5 === 0 ? 2 : 1}
              opacity={i % 5 === 0 ? 0.6 : 0.3}
            />
          );
        })}

        {/* Needle */}
        <motion.line
          x1={CENTER_X}
          y1={CENTER_Y}
          style={{ x2: needleX, y2: needleY }}
          stroke={getMomentumColor(momentum)}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Needle center dot */}
        <circle cx={CENTER_X} cy={CENTER_Y} r="4" fill={getMomentumColor(momentum)} />
        <circle cx={CENTER_X} cy={CENTER_Y} r="2" fill="var(--surface)" />

        {/* Labels */}
        <text
          x={CENTER_X - GAUGE_RADIUS + 10}
          y={CENTER_Y + 20}
          fill="var(--danger)"
          fontSize="10"
          textAnchor="middle"
          opacity="0.7"
        >
          Bowl
        </text>
        <text
          x={CENTER_X + GAUGE_RADIUS - 10}
          y={CENTER_Y + 20}
          fill="var(--brand)"
          fontSize="10"
          textAnchor="middle"
          opacity="0.7"
        >
          Bat
        </text>
      </svg>

      {/* Momentum swing pulse */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={
          pulsing
            ? { boxShadow: ["0 0 0px var(--brand)", "0 0 20px var(--brand)", "0 0 0px var(--brand)"] }
            : {}
        }
        transition={{ duration: 0.6 }}
      />

      <div className="text-sm mt-2 text-center" style={{ color: "var(--text-2)" }}>
        Batting {momentum.toFixed(0)}% — Bowling {(100 - momentum).toFixed(0)}%
      </div>
    </div>
  );
}
