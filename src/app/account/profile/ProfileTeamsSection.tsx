"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { stagger, fadeUp, slideRight } from "@/components/ui/motion";

interface Team {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  logoUrl: string | null;
  role: "OWNER" | "MEMBER";
}

interface Props {
  ownedTeams: Team[];
  memberTeams: Team[];
}

export function ProfileTeamsSection({ ownedTeams, memberTeams }: Props) {
  const allTeams = [
    ...ownedTeams.map(t => ({ ...t, isOwner: true })),
    ...memberTeams.map(t => ({ ...t, isOwner: false })),
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">My Teams</h2>
        <Link
          href="/teams/create"
          className="text-sm text-[var(--accent-brand)] hover:underline"
        >
          + Create Team
        </Link>
      </div>

      {allTeams.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)] py-8 text-center">
          You haven&apos;t created or joined any teams yet.
        </p>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
          {allTeams.map((team) => (
            <motion.div key={team.id} variants={fadeUp}>
              <Link href={`/teams/${team.slug}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer group">
                  {/* Team Logo */}
                  {team.logoUrl ? (
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-brand)]/20 to-[var(--accent-brand)]/5 flex items-center justify-center text-sm font-bold text-[var(--accent-brand)]">
                      {team.shortName}
                    </div>
                  )}

                  {/* Team Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-brand)] transition-colors">
                      {team.name}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{team.shortName}</p>
                  </div>

                  {/* Role Badge */}
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    team.isOwner
                      ? "bg-[var(--accent-brand)]/10 text-[var(--accent-brand)]"
                      : "bg-[var(--bg-overlay)] text-[var(--text-secondary)]"
                  }`}>
                    {team.isOwner ? "Owner" : "Member"}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </Card>
  );
}
