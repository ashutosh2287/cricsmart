"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { stagger, fadeUp } from "@/components/ui/motion";

interface Props {
  matchesHosted: number;
  teamsOwned: number;
  tournamentsOrganized: number;
  savedMatches: number;
  teamMemberships: number;
  tournamentMemberships: number;
}

const stats = [
  { key: "matches", label: "Matches Hosted", icon: "📋", gradient: "from-blue-500/20 to-blue-500/5" },
  { key: "teams", label: "Teams Owned", icon: "🏏", gradient: "from-emerald-500/20 to-emerald-500/5" },
  { key: "tournaments", label: "Tournaments", icon: "🏆", gradient: "from-amber-500/20 to-amber-500/5" },
  { key: "saved", label: "Saved Matches", icon: "🔖", gradient: "from-rose-500/20 to-rose-500/5" },
  { key: "teamMember", label: "Team Memberships", icon: "🤝", gradient: "from-purple-500/20 to-purple-500/5" },
  { key: "tournamentMember", label: "Tournament Entries", icon: "🎯", gradient: "from-cyan-500/20 to-cyan-500/5" },
] as const;

export function ProfileStatsCards({
  matchesHosted,
  teamsOwned,
  tournamentsOrganized,
  savedMatches,
  teamMemberships,
  tournamentMemberships,
}: Props) {
  const values: Record<string, number> = {
    matches: matchesHosted,
    teams: teamsOwned,
    tournaments: tournamentsOrganized,
    saved: savedMatches,
    teamMember: teamMemberships,
    tournamentMember: tournamentMemberships,
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {stats.map((stat) => (
        <motion.div key={stat.key} variants={fadeUp}>
          <Card hover className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-lg`}>
                {stat.icon}
              </div>
              <AnimatedCounter
                value={values[stat.key]}
                label={stat.label}
                duration={1800}
              />
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
