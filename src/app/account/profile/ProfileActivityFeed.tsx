"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { stagger, revealFromLeft } from "@/components/ui/motion";

interface Match {
  id: string;
  title: string;
  teamA: string;
  teamB: string;
  status: string;
  createdAt: string;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface Props {
  recentMatches: Match[];
  tournamentMemberships: Tournament[];
}

const statusColors: Record<string, string> = {
  LIVE: "bg-emerald-500/20 text-emerald-400",
  COMPLETED: "bg-blue-500/20 text-blue-400",
  DRAFT: "bg-amber-500/20 text-amber-400",
};

const statusDots: Record<string, string> = {
  LIVE: "bg-emerald-400",
  COMPLETED: "bg-blue-400",
  DRAFT: "bg-amber-400",
};

export function ProfileActivityFeed({ recentMatches, tournamentMemberships }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Recent Matches */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recent Matches</h2>
          <Link href="/account/matches" className="text-sm text-[var(--accent-brand)] hover:underline">
            View All
          </Link>
        </div>

        {recentMatches.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">
            No matches yet. Host your first match!
          </p>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {recentMatches.map((match) => (
              <motion.div key={match.id} variants={revealFromLeft}>
                <Link href={`/hosted-matches/${match.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer group">
                    {/* Status dot */}
                    <div className={`w-2 h-2 rounded-full ${statusDots[match.status] || "bg-gray-400"} ${match.status === "LIVE" ? "animate-pulse" : ""}`} />

                    {/* Match info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-brand)] transition-colors">
                        {match.title}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {match.teamA} vs {match.teamB}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[match.status] || "bg-gray-500/20 text-gray-400"}`}>
                      {match.status}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>

      {/* Tournament Memberships */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tournaments</h2>
          <Link href="/account/tournaments" className="text-sm text-[var(--accent-brand)] hover:underline">
            View All
          </Link>
        </div>

        {tournamentMemberships.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">
            Not part of any tournaments yet.
          </p>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
            {tournamentMemberships.map((tournament) => (
              <motion.div key={tournament.id} variants={revealFromLeft}>
                <Link href={`/tournaments/${tournament.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center text-lg">
                      🏆
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-brand)] transition-colors">
                        {tournament.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {new Date(tournament.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" – "}
                        {new Date(tournament.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>
    </div>
  );
}
