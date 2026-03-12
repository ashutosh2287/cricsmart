"use client";

type Props = {
  team1: string;
  team2: string;
  runs: number;
  wickets: number;
  over: number;
  ball: number;
};

export default function MatchHeader({
  team1,
  team2,
  runs,
  wickets,
  over,
  ball
}: Props) {

  return (

    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">

      <div className="flex justify-between items-center">

        {/* LEFT SIDE — MATCH INFO */}

        <div className="space-y-1">

          <h1 className="text-2xl font-bold flex items-center gap-3">

            {team1} vs {team2}

            {/* LIVE INDICATOR */}

            <span className="flex items-center gap-2 text-red-500 text-sm font-semibold">

              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />

              LIVE

            </span>

          </h1>

          <div className="text-sm text-gray-400">
            Real-Time Match Analytics
          </div>

        </div>

        {/* RIGHT SIDE — SCORE */}

        <div className="text-right space-y-1">

          <div className="text-4xl font-bold text-green-400 tracking-wide">
            {runs}/{wickets}
          </div>

          <div className="text-sm text-gray-400">
            Overs {over}.{ball}
          </div>

        </div>

      </div>

      {/* SUBTLE DIVIDER */}

      <div className="mt-4 border-b border-zinc-800"></div>

    </div>

  );

}