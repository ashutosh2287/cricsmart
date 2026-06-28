"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/components/ui/motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import EmptyState from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Plus, MapPin, Calendar, Trophy, Tag } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  format: string | null;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((data) => setTournaments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <Breadcrumbs items={[{ label: "Tournaments" }]} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
            <span className="gradient-text">Tournaments</span>
          </h1>
          <p className="text-sm text-[var(--text-2)] mt-1">Create and manage cricket tournaments</p>
        </div>
        <Link
          href="/tournaments/create"
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
        >
          <Plus className="w-4 h-4" /> Create Tournament
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
      ) : tournaments.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-6 h-6 text-[var(--text-3)]" />}
          title="No tournaments yet"
          description="Create your first tournament to organize matches and track standings."
          action={
            <Link
              href="/tournaments/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> Create Tournament
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
          {tournaments.map((t) => (
            <motion.div key={t.id} variants={fadeUp}>
              <Link href={`/tournaments/${t.id}`}>
                <div className="card-cinematic group p-5">
                  <div className="flex items-center justify-between mb-3">
                    {t.format && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[var(--brand-light)] text-[var(--brand)] border border-[var(--brand)]/20">
                        <Tag className="w-2.5 h-2.5" /> {t.format}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-[var(--text-1)] group-hover:text-[var(--brand)] transition-colors">
                    {t.name}
                  </h3>

                  <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-3)]">
                    {t.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {t.location}
                      </span>
                    )}
                    {t.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(t.startDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1 text-xs text-[var(--brand)] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View tournament</span>
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
