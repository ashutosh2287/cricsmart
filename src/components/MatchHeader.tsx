
"use client";

import { getMatchMeta } from "@/store/matchStore";
import AnimatedScore from "./ui/AnimatedScore";

type Batsman = {
  name: string;
  runs: number;
  balls: number;
  isStriker?: boolean;
};

type Bowler = {
  name: string;
  overs: number;
  runs: number;
  wickets: number;
};

type Props = {
  team1: string;
  team2: string;
  runs: number;
  wickets: number;
  over: number;
  ball: number;

  // 🔥 NEW DATA
  striker?: Batsman;
  nonStriker?: Batsman;
  bowler?: Bowler;
  lastOverBalls?: string[]; // ["1", "4", "W", "0", "6"]
};

export default function MatchHeader({
  team1,
  team2,
  runs,
  wickets,
  over,
  ball,
  striker,
  nonStriker,
  bowler,
  lastOverBalls = [],
}: Props) {

  // ✅ GET FROM STORE
  console.log("🏏 MATCH HEADER RENDER");
  const matchMeta = null;

  // ✅ FINAL TEAM RESOLUTION
  const finalTeam1 = team1 ?? "Team A";
  const finalTeam2 = team2 ?? "Team B";

  const scoreKey = `${runs}-${wickets}`;

  return (
    <div className="sticky top-4 z-30 mb-6">

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm">

        {/* HEADER */}
        <div className="px-5 py-5 md:px-6 md:py-6">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            {/* LEFT SIDE */}
            <div className="space-y-4">

              {/* LIVE BADGE */}
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  LIVE
                </span>

                <span className="text-xs text-white/50">
                  Real-time analytics
                </span>
              </div>

              {/* TEAMS */}
              <div>
                <h1 className="text-xl font-semibold text-white md:text-2xl">
                  {finalTeam1} <span className="text-white/40">vs</span> {finalTeam2}
                </h1>

                <p className="text-xs text-white/50 mt-1">
                  Match center & live simulation
                </p>
              </div>

              {/* 🔥 CURRENT PLAYERS */}
              {(striker || nonStriker || bowler) && (
                <div className="text-sm text-white/80 space-y-1">

                  {striker && (
                    <div>
                      ⭐ {striker.name} {striker.runs}({striker.balls})
                    </div>
                  )}

                  {nonStriker && (
                    <div className="text-white/60">
                      {nonStriker.name} {nonStriker.runs}({nonStriker.balls})
                    </div>
                  )}

                  {bowler && (
                    <div className="text-blue-400 text-xs mt-1">
                      {bowler.name} {bowler.overs}-{bowler.runs}-{bowler.wickets}
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* RIGHT SIDE (SCORE) */}
            <div className="text-left md:text-right">

              {/* SCORE */}
              <div
                key={scoreKey}
                className="text-3xl font-bold text-white transition duration-200 ease-out animate-[pulse_0.3s]"
              >
                <AnimatedScore value={`${runs}/${wickets}`} />
              </div>

              {/* OVERS */}
              <div className="text-sm text-white/60 mt-1">
                Overs {over}.{ball}
              </div>

              {/* 🔥 LAST OVER */}
              {lastOverBalls.length > 0 && (
                <div className="flex gap-1 justify-start md:justify-end mt-2">

                  {lastOverBalls.map((b, i) => (
                    <span
                      key={i}
                      className={`
                        text-xs px-2 py-1 rounded
                        ${
                          b === "W"
                            ? "bg-red-500/20 text-red-400"
                            : b === "4"
                            ? "bg-green-500/20 text-green-400"
                            : b === "6"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-white/10 text-white/70"
                        }
                      `}
                    >
                      {b}
                    </span>
                  ))}

                </div>
              )}

              {/* LABEL */}
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 mt-2">
                Current innings
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-t border-white/10 text-sm">

          <div className="px-4 py-3 border-r border-white/10">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Status
            </p>
            <p className="text-white mt-1">Live</p>
          </div>

          <div className="px-4 py-3 border-r border-white/10">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Format
            </p>
            <p className="text-white mt-1">Simulation</p>
          </div>

          <div className="px-4 py-3 border-r border-white/10">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Overs
            </p>
            <p className="text-white mt-1">
              {over}.{ball}
            </p>
          </div>

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-white/40">
              Score
            </p>
            <span className="mt-1 text-sm font-semibold text-white">
  <AnimatedScore value={`${runs}/${wickets}`} />
</span>
          </div>

        </div>

      </div>
    </div>
  );
}