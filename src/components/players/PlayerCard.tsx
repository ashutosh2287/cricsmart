"use client";

import { motion } from "framer-motion";
import { getPlayerStat } from "@/services/analytics/playerStatsEngine";
import { getPlayerImpact } from "@/services/analytics/playerImpactEngine";
import PlayerFormGraph from "@/components/analytics/PlayerFormGraph";

type Props = {
  matchId: string;
  name: string;
  team: string;
};

export default function PlayerCard({
  matchId,
  name,
  team
}: Props) {

  const stats = getPlayerStat(matchId, name);

  const runs = stats?.batting.runs ?? 0;
  const balls = stats?.batting.balls ?? 0;

  const strikeRate =
    balls > 0 ? ((runs / balls) * 100).toFixed(1) : "0";

  const wickets = stats?.bowling.wickets ?? 0;

  const impact = getPlayerImpact(matchId, name);

  return (

    <motion.div
      whileHover={{ scale: 1.04 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg cursor-pointer hover:border-blue-500 hover:shadow-blue-500/20 transition-all"
    >

      {/* PLAYER HEADER */}

      <div className="flex items-center justify-between mb-4">

        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-xs text-gray-400">{team}</p>
        </div>

        <div className="text-xs px-2 py-1 rounded bg-zinc-800 text-gray-300">
          Player
        </div>

      </div>


      {/* STATS GRID */}

      <div className="grid grid-cols-2 gap-4 text-sm">

        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Runs</p>
          <p className="font-semibold">{runs}</p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Balls</p>
          <p className="font-semibold">{balls}</p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Strike Rate</p>
          <p className="font-semibold">{strikeRate}</p>
        </div>

        <div className="bg-zinc-800 rounded-lg p-3">
          <p className="text-gray-400 text-xs">Wickets</p>
          <p className="font-semibold text-green-400">{wickets}</p>
        </div>

      </div>


      {/* IMPACT SCORE */}

      <div className="mt-5 flex items-center justify-between bg-zinc-800 rounded-lg p-3">

        <span className="text-gray-400 text-sm">
          Impact Score
        </span>

        <span className="text-green-400 font-bold">
          {impact}
        </span>

      </div>

      {/* Player Form Graph */}

      <div className="mt-6">
  <PlayerFormGraph playerId={name} />
</div>

    </motion.div>

  );

}