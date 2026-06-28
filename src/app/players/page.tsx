"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { staggerGrid, gridItem } from "@/components/ui/motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import PlayerAvatar from "@/components/ui/PlayerAvatar";
import EmptyState from "@/components/ui/EmptyState";
import { Search, Users } from "lucide-react";

interface Player {
  id: string;
  name: string;
  team: string;
  role?: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/players")
      .then((r) => r.json())
      .then((data) => setPlayers(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      <Breadcrumbs items={[{ label: "Players" }]} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="gradient-text">Players</span>
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1">Performance analytics and impact statistics</p>
        </div>
        <Link
          href="/players/discover"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg border border-[var(--border-med)] text-[var(--text-2)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all"
        >
          <Search className="w-4 h-4" /> Discover Profiles
        </Link>
      </motion.div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-3)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search players or teams..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-[var(--border-med)] bg-[var(--surface-3)] text-[var(--text-1)] placeholder:text-[var(--text-3)] focus:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/15 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--surface-3)]" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 rounded bg-[var(--surface-3)]" />
                  <div className="h-3 w-16 rounded bg-[var(--surface-3)]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 rounded-lg bg-[var(--surface-3)]" />
                <div className="h-16 rounded-lg bg-[var(--surface-3)]" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-[var(--text-3)]" />}
          title={search ? "No players match your search" : "No players yet"}
          description={search ? "Try a different search term." : "Players will appear here once matches are played."}
        />
      ) : (
        <motion.div
          variants={staggerGrid}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filtered.map((player) => (
            <motion.div key={player.id} variants={gridItem}>
              <Link href={`/players/profiles/${player.id}`}>
                <div className="card-cinematic group p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <PlayerAvatar name={player.name} size="lg" />
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-1)] group-hover:text-[var(--brand)] transition-colors">
                        {player.name}
                      </h3>
                      <p className="text-xs text-[var(--text-3)]">{player.team}</p>
                    </div>
                  </div>

                  {player.role && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-[var(--surface-3)] text-[var(--text-3)]">
                      {player.role}
                    </span>
                  )}

                  <div className="mt-3 flex items-center gap-1 text-xs text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View profile</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </main>
  );
}
