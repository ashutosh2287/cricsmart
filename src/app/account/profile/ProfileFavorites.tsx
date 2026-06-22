"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { stagger, fadeUp } from "@/components/ui/motion";

interface FollowedTeam {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  logoUrl: string | null;
}

interface Props {
  followedTeams: FollowedTeam[];
  favoriteTeams: FollowedTeam[];
}

export function ProfileFavorites({ followedTeams, favoriteTeams }: Props) {
  return (
    <div className="space-y-6">
      {/* Followed Teams */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Following</h2>
          <Link
            href="/teams"
            className="text-sm text-[var(--accent-brand)] hover:underline"
          >
            Discover Teams
          </Link>
        </div>

        {followedTeams.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">
            You&apos;re not following any teams yet.
          </p>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-3"
          >
            {followedTeams.map((team) => (
              <motion.div key={team.id} variants={fadeUp}>
                <Link href={`/teams/${team.slug}`}>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer group">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[var(--accent-brand)]/20 to-[var(--accent-brand)]/5 flex items-center justify-center text-sm font-bold text-[var(--accent-brand)]">
                        {team.shortName}
                      </div>
                    )}
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate w-full text-center group-hover:text-[var(--accent-brand)] transition-colors">
                      {team.name}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </Card>

      {/* Favorite Teams */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Favourites</h2>
        </div>

        {favoriteTeams.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] py-6 text-center">
            No favourite teams yet. Heart a team to add it here.
          </p>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-3 gap-3"
          >
            {favoriteTeams.map((team) => (
              <motion.div key={team.id} variants={fadeUp}>
                <Link href={`/teams/${team.slug}`}>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer group">
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={team.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-500/5 flex items-center justify-center text-sm font-bold text-rose-400">
                        {team.shortName}
                      </div>
                    )}
                    <p className="text-xs font-medium text-[var(--text-primary)] truncate w-full text-center group-hover:text-[var(--accent-brand)] transition-colors">
                      {team.name}
                    </p>
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
