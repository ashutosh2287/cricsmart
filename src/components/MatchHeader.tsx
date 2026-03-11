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

    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">

      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">
            {team1} vs {team2}
          </h1>

          <div className="text-sm text-gray-400 mt-1">
            Live Match
          </div>
        </div>

        <div className="text-right">

          <div className="text-3xl font-bold text-green-400">
            {runs}/{wickets}
          </div>

          <div className="text-gray-400">
            ({over}.{ball} overs)
          </div>

        </div>

      </div>

    </div>

  );

}