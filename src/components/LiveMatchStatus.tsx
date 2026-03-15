"use client";

import { useMatch } from "@/context/MatchContext";

export default function LiveMatchStatus() {

  const { state } = useMatch();

  if (!state) return null;

  const innings = state.innings[state.currentInningsIndex];

  if (!innings) return null;

  return (

    <div className="bg-gradient-to-r from-blue-900/40 via-zinc-900 to-purple-900/40 border border-zinc-800 rounded-xl p-4 shadow-lg">

      <div className="flex flex-wrap gap-6 text-sm text-gray-300">

        <div>
          <span className="text-gray-400">Score:</span>{" "}
          <span className="text-white font-semibold">
            {innings.runs}/{innings.wickets}
          </span>
        </div>

        <div>
          <span className="text-gray-400">Overs:</span>{" "}
          <span className="text-white font-semibold">
            {innings.over}.{innings.ball}
          </span>
        </div>

        <div>
          <span className="text-gray-400">Innings:</span>{" "}
          <span className="text-white font-semibold">
            {state.currentInningsIndex + 1}
          </span>
        </div>

      </div>

    </div>

  );

}