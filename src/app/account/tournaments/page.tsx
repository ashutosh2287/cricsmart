"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/components/ui/motion";

interface TournamentRecord {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status?: string;
  teamsCount: number;
  matchesCount: number;
}

const statusColor: Record<string, string> = {
  UPCOMING: "text-blue-400",
  ONGOING: "text-green-400",
  COMPLETED: "text-zinc-400",
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/account/tournaments")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setTournaments(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-brand)]">
            Account
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">My Tournaments</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Tournaments you&apos;ve organized or joined.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-xl"
                style={{ background: "var(--surface-3)" }}
              />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <section className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-center">
            <p className="text-3xl">🏆</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">No tournaments yet</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Create or join a tournament to see it here.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/host/matches/create"
                className="rounded-lg border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition hover:border-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                Host a match
              </Link>
              <Link
                href="/account"
                className="rounded-lg border border-[var(--accent-brand)]/35 px-3 py-1.5 text-sm text-[var(--accent-brand)] transition hover:border-[var(--accent-brand)]/65"
              >
                Back to account
              </Link>
            </div>
          </section>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-4 sm:grid-cols-2"
          >
            {tournaments.map((t) => {
              const now = new Date();
              const start = new Date(t.startDate);
              const end = new Date(t.endDate);
              let status = "UPCOMING";
              if (now > end) status = "COMPLETED";
              else if (now >= start) status = "ONGOING";

              return (
                <motion.div key={t.id} variants={fadeUp}>
                  <Link
                    href={`/tournaments/${t.id}`}
                    className="block rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition hover:border-[var(--text-muted)]"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-[var(--text-primary)]">{t.name}</h3>
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${statusColor[status] ?? "text-[var(--text-secondary)]"}`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-secondary)]">
                      {start.toLocaleDateString()} – {end.toLocaleDateString()}
                    </p>
                    <div className="mt-3 flex gap-4 text-xs text-[var(--text-muted)]">
                      <span>{t.teamsCount} team{t.teamsCount === 1 ? "" : "s"}</span>
                      <span>{t.matchesCount} match{t.matchesCount === 1 ? "" : "es"}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </main>
  );
}
