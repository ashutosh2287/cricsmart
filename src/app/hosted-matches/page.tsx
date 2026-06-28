"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/components/ui/motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import MatchStatusBadge from "@/components/ui/MatchStatusBadge";
import TeamLogo from "@/components/ui/TeamLogo";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, MapPin, Calendar } from "lucide-react";

interface HostedMatch {
  id: string;
  title: string;
  status: string;
  teamA: { name: string } | null;
  teamB: { name: string } | null;
  venue?: string | null;
  createdAt: string;
}

export default function HostedMatchesPage() {
  const [matches, setMatches] = useState<HostedMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hosted-matches")
      .then((r) => r.json())
      .then((data) => setMatches(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Breadcrumbs items={[{ label: "Hosted Matches" }]} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="gradient-text">Hosted</span> Matches
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1">Matches you have created and managed</p>
        </div>
        <Link
          href="/host/matches/create"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" /> Host Match
        </Link>
      </motion.div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
              <Skeleton variant="text" className="w-1/3" />
              <Skeleton variant="text" className="w-2/3" />
              <Skeleton variant="text" className="w-1/2" />
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          title="No hosted matches yet"
          description="Create your first match to get started with real-time scoring and analytics."
          action={
            <Link
              href="/host/matches/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[#0077FF] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> Host Your First Match
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
          {matches.map((match) => (
            <motion.div key={match.id} variants={fadeUp}>
              <Link href={`/hosted-matches/${match.id}`}>
                <div className="card-cinematic group p-5">
                  <div className="flex items-center justify-between mb-3">
                    <MatchStatusBadge
                      status={
                        match.status === "LIVE" ? "live" :
                        match.status === "COMPLETED" ? "completed" : "upcoming"
                      }
                    />
                    <span className="text-[10px] text-[var(--text-3)] uppercase tracking-wider">
                      {match.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <TeamLogo name={match.teamA?.name ?? "TBA"} size="sm" />
                    <span className="text-sm font-semibold text-[var(--text-1)] truncate">
                      {match.teamA?.name ?? "TBA"}
                    </span>
                    <span className="text-xs text-[var(--text-3)]">vs</span>
                    <span className="text-sm font-semibold text-[var(--text-1)] truncate">
                      {match.teamB?.name ?? "TBA"}
                    </span>
                    <TeamLogo name={match.teamB?.name ?? "TBA"} size="sm" />
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-3)]">
                    {match.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {match.venue}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(match.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open match</span>
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
