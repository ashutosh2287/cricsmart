"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/components/ui/motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import TeamLogo from "@/components/ui/TeamLogo";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, Users, MapPin, Shield } from "lucide-react";

interface Team {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  city: string | null;
  visibility: string;
  _count?: { members: number };
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data) => setTeams(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Breadcrumbs items={[{ label: "Teams" }]} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="gradient-text">Teams</span>
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1">Create and manage your cricket teams</p>
        </div>
        <Link
          href="/teams/create"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" /> Create Team
        </Link>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton variant="circle" className="w-10 h-10" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
              <Skeleton variant="text" className="w-1/3" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6 text-[var(--text-3)]" />}
          title="No teams yet"
          description="Create your first team to start managing squads and players."
          action={
            <Link
              href="/teams/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> Create Team
            </Link>
          }
        />
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2"
        >
          {teams.map((team) => (
            <motion.div key={team.id} variants={fadeUp}>
              <Link href={`/teams/${team.slug}`}>
                <div className="card-cinematic group p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <TeamLogo name={team.name} shortName={team.shortName ?? undefined} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-[var(--text-1)] group-hover:text-[var(--brand)] transition-colors truncate">
                        {team.name}
                      </h3>
                      {team.shortName && (
                        <p className="text-xs text-[var(--text-3)]">{team.shortName}</p>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-[var(--surface-3)] text-[var(--text-3)]">
                      <Shield className="w-2.5 h-2.5" />
                      {team.visibility === "PRIVATE" ? "Private" : "Public"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[var(--text-3)]">
                    {team.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {team.city}
                      </span>
                    )}
                    {team._count && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {team._count.members} members
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View team</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
