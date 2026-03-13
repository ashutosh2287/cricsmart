"use client";

import PageMotion from "@/components/ui/PageMotion";
import { motion } from "framer-motion";
import { getPlayers } from "@/services/playerService";
import PlayerCard from "@/components/players/PlayerCard";
import PlayerFormGraph from "@/components/analytics/PlayerFormGraph";

export default function PlayersPage() {

  const players = getPlayers();

  return (

    <PageMotion>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10 text-white">

        {/* PAGE HEADER */}

        <div className="space-y-2">

          <h1 className="text-3xl font-bold tracking-wide">
            Players
          </h1>

          <p className="text-gray-400 text-sm">
            Performance analytics and impact statistics
          </p>

          <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mt-4"/>

        </div>


        {/* PLAYER GRID */}

        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >

          {players.map(player => (

            <motion.div
              key={player.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
            >

              <PlayerCard
                matchId="ind-vs-aus"
                name={player.name}
                team={player.team}
              />

            </motion.div>

          ))}

        </motion.div>

      </main>

    </PageMotion>

  );

}