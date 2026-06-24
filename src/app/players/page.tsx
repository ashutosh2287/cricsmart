"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { getPlayers } from "@/services/playerService";
import PlayerCard from "@/components/players/PlayerCard";
import { staggerGrid, gridItem } from "@/components/ui/motion";
import { User } from "lucide-react";

export default function PlayersPage() {
  const players = getPlayers();

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
          <span className="gradient-text">Players</span>
        </h1>
        <p className="text-sm text-[var(--text-2)]">
          Performance analytics and impact statistics
        </p>
        <Link href="/players/discover" className="inline-flex px-4 py-2 text-xs font-semibold rounded-lg border border-[var(--border-med)] text-[var(--text-2)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">
          Discover Profiles
        </Link>
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent"/>
      </div>

      <motion.div
        variants={staggerGrid}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {players.length === 0 ? (
          <div className="col-span-3 card-cinematic-static p-8 text-center">
            <User className="w-8 h-8 mx-auto text-[var(--text-3)] mb-3" />
            <p className="text-sm text-[var(--text-3)]">No players found.</p>
          </div>
        ) : (
          players.map((player) => (
            <motion.div key={player.id} variants={gridItem}>
              <PlayerCard matchId="ind-vs-aus" name={player.name} team={player.team} />
            </motion.div>
          ))
        )}
      </motion.div>
    </main>
  );
}
