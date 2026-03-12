"use client";

import { motion } from "framer-motion";
import { getPlayerStat } from "@/services/analytics/playerStatsEngine";

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

  return (

    <motion.div
      whileHover={{ scale: 1.03 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg cursor-pointer hover:border-blue-500 transition-colors"
    >

      <h3 className="text-lg font-semibold">{name}</h3>

      <p className="text-sm text-gray-400 mb-3">{team}</p>

      <div className="space-y-1 text-sm">

        <div className="flex justify-between">
          <span className="text-gray-400">Runs</span>
          <span>{runs}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Balls</span>
          <span>{balls}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Strike Rate</span>
          <span>{strikeRate}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">Wickets</span>
          <span className="text-green-400 font-semibold">
            {wickets}
          </span>
        </div>

      </div>

    </motion.div>

  );

}