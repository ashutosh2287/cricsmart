"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp, springBounce, slideRight, revealOnScroll } from "@/components/ui/motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { LiveMatchDropdown } from "@/components/home/LiveMatchDropdown";

/* ─── Types ─── */

type ApiMatch = { matchId: string; teamA: string; teamB: string; status: "LIVE" | "UPCOMING" | "COMPLETED" };
type Match = { matchId: string; teamA: string; teamB: string; status: "Live" | "Upcoming" | "Completed" };
type ScoreEntry = { r?: number; w?: number; o?: number; inning?: string };
type RealMatch = { id: string; name?: string; status?: string; teams?: string[]; score?: ScoreEntry[]; isLive?: boolean; matchCategory?: string; matchType?: string };

interface HostedMatch { id: string; runtimeMatchId: string; title: string; teamA: string; teamB: string; }

interface Props {
  user: { username: string; avatarUrl: string | null } | null;
  liveMatchCount: number;
  teamCount: number;
  totalMatchCount: number;
  liveHostedMatches: HostedMatch[];
  isLoggedIn: boolean;
}

function formatScore(entry: ScoreEntry): string {
  return `${entry.r ?? 0}/${entry.w ?? 0} (${entry.o ?? 0} ov)`;
}

const statusColors: Record<string, string> = {
  Live: "text-red-400",
  Completed: "text-[var(--text-muted)]",
  Upcoming: "text-[var(--accent-brand)]",
};

const statusDots: Record<string, string> = {
  Live: "bg-red-400 animate-pulse",
  Completed: "bg-[var(--text-muted)]",
  Upcoming: "bg-[var(--accent-brand)]",
};

export default function HomePageClient({
  user,
  liveMatchCount,
  teamCount,
  totalMatchCount,
  liveHostedMatches,
  isLoggedIn,
}: Props) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<RealMatch[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamAInput, setTeamAInput] = useState("");
  const [teamBInput, setTeamBInput] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const { authEnabled, isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/matches");
        const data: ApiMatch[] = await res.json();
        if (mounted) setMatches(data.map((m) => ({
          matchId: m.matchId, teamA: m.teamA, teamB: m.teamB,
          status: m.status === "LIVE" ? "Live" : m.status === "COMPLETED" ? "Completed" : "Upcoming",
        })));
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = await res.json();
        if (!mounted) return;
        setLiveMatches((Array.isArray(payload.data) ? payload.data : []).filter((m: RealMatch) => m.isLive));
      } catch {}
    };
    load();
    const interval = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleCreateMatch = async () => {
    if (!authLoading && authEnabled && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent("/")}`);
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/create-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamA: teamAInput || "Team A", teamB: teamBInput || "Team B" }),
      });
      const data = await res.json();
      if (data?.matchId) router.push(`/admin/${data.matchId}`);
    } catch {} finally { setCreating(false); }
  };

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-8">

        {/* ── Welcome Header ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-brand)]/5 via-transparent to-[var(--accent-brand)]/10 pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-16 h-16 rounded-xl object-cover border border-[var(--accent-brand)]/30" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--accent-brand)] to-[var(--accent-brand)]/60 flex items-center justify-center text-xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase() || "C"}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                Welcome back, {user?.username || "Guest"}
              </h1>
              <p className="mt-1 text-[var(--text-secondary)]">
                {liveMatchCount > 0
                  ? `${liveMatchCount} live match${liveMatchCount > 1 ? "es" : ""} in progress`
                  : "No live matches right now — create one to get started"
                }
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/matches">
                <Button variant="secondary">Browse Matches</Button>
              </Link>
              <Button variant="primary" onClick={() => setShowCreateForm(!showCreateForm)}>
                + New Simulation
              </Button>
            </div>
          </div>
        </motion.section>

        {/* ── Create Form ── */}
        <AnimatePresence>
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-6 border-[var(--accent-brand)]/30">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Configure Simulation</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]/30"
                    placeholder="Team A Name"
                    value={teamAInput}
                    onChange={(e) => setTeamAInput(e.target.value)}
                  />
                  <input
                    className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-overlay)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand)]/30"
                    placeholder="Team B Name"
                    value={teamBInput}
                    onChange={(e) => setTeamBInput(e.target.value)}
                  />
                  <Button variant="primary" loading={creating} onClick={handleCreateMatch}>
                    {creating ? "Launching..." : "Start Engine"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Overview ── */}
        <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Live Matches", value: liveMatchCount, icon: "🔴" },
            { label: "Total Matches", value: totalMatchCount, icon: "📋" },
            { label: "Teams", value: teamCount, icon: "🏏" },
            { label: "Simulations", value: matches.length, icon: "⚡" },
          ].map((stat) => (
            <motion.div key={stat.label} variants={fadeUp}>
              <Card className="p-4 text-center">
                <p className="text-lg mb-1">{stat.icon}</p>
                <AnimatedCounter value={stat.value} label={stat.label} duration={1500} />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Live Matches ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Live Matches
              {liveMatches.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">
                  {liveMatches.length}
                </span>
              )}
            </h2>
            <Link href="/matches" className="text-sm text-[var(--accent-brand)] hover:underline">View All →</Link>
          </div>

          {liveMatches.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[var(--text-muted)] text-sm">No live matches right now. Check back soon.</p>
            </Card>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveMatches.slice(0, 6).map((m) => {
                const scores = Array.isArray(m.score) ? m.score : [];
                return (
                  <motion.div key={m.id} variants={fadeUp}>
                    <Link href={`/matches/${m.id}`}>
                      <Card hover className="p-4 group">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider mb-2">
                          <span className="text-[var(--text-muted)]">{m.matchCategory || m.matchType || "Domestic"}</span>
                          <span className="flex items-center gap-1 text-red-400 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            LIVE
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-brand)] transition-colors">
                          {m.name?.replace(/\s+vs\s+/i, " vs ")}
                        </p>
                        {scores.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] space-y-0.5">
                            {scores.slice(0, 2).map((s, idx) => (
                              <p key={idx} className="text-xs font-mono text-[var(--text-secondary)] tabular-nums">
                                {formatScore(s)}
                              </p>
                            ))}
                          </div>
                        )}
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* ── Your Simulations ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Your Simulations</h2>
            <span className="text-xs text-[var(--text-muted)]">
              {matches.length} match{matches.length !== 1 ? "es" : ""}
            </span>
          </div>

          {matches.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-[var(--text-muted)] text-sm mb-3">No simulations yet.</p>
              <Button variant="ghost" onClick={() => setShowCreateForm(true)}>+ Create First Simulation</Button>
            </Card>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              {matches.map((m) => (
                <motion.div key={m.matchId} variants={slideRight}>
                  <Card hover className="p-4">
                    <div className="flex items-center justify-between">
                      <Link href={`/match/${m.matchId}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                        <span className={`w-2 h-2 rounded-full ${statusDots[m.status]}`} />
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--accent-brand)] transition-colors">
                          {m.teamA} vs {m.teamB}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColors[m.status]}`}>
                          {m.status}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/match/${m.matchId}`}>
                          <Button variant="ghost" className="text-xs">Open →</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* ── Quick Actions ── */}
        <section>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Host Match", href: "/host/matches/create", icon: "📋", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20", hoverBorder: "hover:border-blue-500/40" },
              { label: "Create Team", href: "/teams/create", icon: "🏏", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", hoverBorder: "hover:border-emerald-500/40" },
              { label: "Tournaments", href: "/tournaments/create", icon: "🏆", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", hoverBorder: "hover:border-amber-500/40" },
              { label: "Saved Items", href: "/account/saved", icon: "⭐", color: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/20", hoverBorder: "hover:border-rose-500/40" },
            ].map((action) => (
              <motion.div key={action.label} variants={springBounce}>
                <Link href={action.href}>
                  <Card hover className={`p-4 text-center border ${action.border} ${action.hoverBorder} transition-colors group`}>
                    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-brand)] transition-colors">
                      {action.label}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Live Hosted Matches (Dropdown) ── */}
        {isLoggedIn && liveHostedMatches.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Live Hosted Matches</h2>
            <LiveMatchDropdown count={liveMatchCount} matches={liveHostedMatches} />
          </section>
        )}

      </div>
    </main>
  );
}
