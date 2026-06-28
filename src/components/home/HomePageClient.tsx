"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { staggerGrid, gridItem, cardHover } from "@/components/ui/motion";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { LiveMatchDropdown } from "@/components/home/LiveMatchDropdown";
import GlowBadge from "@/components/ui/GlowBadge";
import StatCounter from "@/components/ui/StatCounter";
import { Radio, Users, BarChart3, Zap, Plus, Trophy, Star, Search } from "lucide-react";

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

const statusConfig: Record<string, { color: "red" | "green" | "cyan"; label: string }> = {
  Live: { color: "red", label: "LIVE" },
  Completed: { color: "green", label: "DONE" },
  Upcoming: { color: "cyan", label: "SOON" },
};

const quickActions = [
  { label: "Host Match", href: "/host/matches/create", icon: <Radio className="w-5 h-5" />, color: "cyan" as const },
  { label: "Create Team", href: "/teams/create", icon: <Users className="w-5 h-5" />, color: "green" as const },
  { label: "Tournaments", href: "/tournaments/create", icon: <Trophy className="w-5 h-5" />, color: "amber" as const },
  { label: "Saved Items", href: "/account/saved", icon: <Star className="w-5 h-5" />, color: "purple" as const },
];

const actionColors: Record<string, string> = {
  cyan: "text-[var(--brand)] group-hover:bg-[rgba(0,229,255,0.08)]",
  green: "text-[var(--success)] group-hover:bg-[rgba(0,255,135,0.08)]",
  amber: "text-[var(--amber)] group-hover:bg-[rgba(245,158,11,0.08)]",
  purple: "text-[var(--accent)] group-hover:bg-[rgba(124,58,237,0.08)]",
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
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

  const handleDelete = async (matchId: string) => {
    setDeletingId(matchId);
    try {
      const res = await fetch("/api/matches/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (res.ok) {
        setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
      }
    } catch {} finally { setDeletingId(null); }
  };

  return (
    <main className="min-h-screen bg-[var(--surface-2)] text-[var(--text-1)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-8">

        {/* ── Welcome Hero ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8"
        >
          <div className="absolute inset-0 gradient-mesh pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-16 h-16 rounded-xl object-cover border border-[var(--border-bright)]" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--accent)] flex items-center justify-center text-xl font-bold text-white">
                {user?.username?.charAt(0).toUpperCase() || "C"}
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">
                Welcome back, <span className="gradient-text">{user?.username || "Guest"}</span>
              </h1>
              <p className="mt-1 text-[var(--text-2)]">
                {liveMatchCount > 0
                  ? `${liveMatchCount} live match${liveMatchCount > 1 ? "es" : ""} in progress`
                  : "No live matches right now — create one to get started"
                }
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/matches" className="px-5 py-2.5 text-sm font-medium rounded-lg border border-[var(--border-med)] text-[var(--text-2)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-all">
                Browse Matches
              </Link>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                New Simulation
              </button>
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
              <div className="card-cinematic-static p-6 glow-border">
                <h3 className="text-sm font-semibold mb-4">Configure Simulation</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="sr-only" htmlFor="team-a-input">Team A Name</label>
                  <input id="team-a-input" className="flex-1" placeholder="Team A Name" value={teamAInput} onChange={(e) => setTeamAInput(e.target.value)} />
                  <label className="sr-only" htmlFor="team-b-input">Team B Name</label>
                  <input id="team-b-input" className="flex-1" placeholder="Team B Name" value={teamBInput} onChange={(e) => setTeamBInput(e.target.value)} />
                  <button
                    onClick={handleCreateMatch}
                    disabled={creating}
                    className="px-6 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[var(--brand)] to-[var(--brand-dark)] text-white hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all disabled:opacity-50"
                  >
                    {creating ? "Launching..." : "Start Engine"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats Overview ── */}
        <motion.div
          variants={staggerGrid}
          initial="hidden"
          animate="visible"
          className="grid gap-4 grid-cols-2 lg:grid-cols-4"
        >
          <motion.div variants={gridItem}>
            <div className="card-cinematic-static p-5 text-center">
              <StatCounter value={liveMatchCount} label="Live Matches" color="cyan" icon={<Radio className="w-5 h-5" />} />
            </div>
          </motion.div>
          <motion.div variants={gridItem}>
            <div className="card-cinematic-static p-5 text-center">
              <StatCounter value={totalMatchCount} label="Total Matches" color="green" icon={<BarChart3 className="w-5 h-5" />} />
            </div>
          </motion.div>
          <motion.div variants={gridItem}>
            <div className="card-cinematic-static p-5 text-center">
              <StatCounter value={teamCount} label="Teams" color="purple" icon={<Users className="w-5 h-5" />} />
            </div>
          </motion.div>
          <motion.div variants={gridItem}>
            <div className="card-cinematic-static p-5 text-center">
              <StatCounter value={matches.length} label="Simulations" color="amber" icon={<Zap className="w-5 h-5" />} />
            </div>
          </motion.div>
        </motion.div>

        {/* ── Live Matches ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <GlowBadge color="red" pulse>LIVE</GlowBadge>
              Live Matches
            </h2>
            <Link href="/matches" className="text-sm text-[var(--brand)] hover:underline">View All →</Link>
          </div>

          {liveMatches.length === 0 ? (
            <div className="card-cinematic-static p-8 text-center">
              <p className="text-[var(--text-3)] text-sm">No live matches right now. Check back soon.</p>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveMatches.slice(0, 6).map((m) => {
                const scores = Array.isArray(m.score) ? m.score : [];
                return (
                  <motion.div key={m.id} variants={gridItem}>
                    <Link href={`/matches/${m.id}`}>
                      <div className="card-cinematic group p-4">
                        <div className="flex justify-between items-center text-[10px] uppercase tracking-wider mb-2">
                          <span className="text-[var(--text-3)]">{m.matchCategory || m.matchType || "Domestic"}</span>
                          <GlowBadge color="red" pulse>LIVE</GlowBadge>
                        </div>
                        <p className="text-sm font-semibold truncate group-hover:text-[var(--brand)] transition-colors">
                          {m.name?.replace(/\s+vs\s+/i, " vs ")}
                        </p>
                        {scores.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-0.5">
                            {scores.slice(0, 2).map((s, idx) => (
                              <p key={idx} className="text-xs font-mono text-[var(--text-2)] tabular-nums">
                                {formatScore(s)}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
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
            <h2 className="text-lg font-semibold">Your Simulations</h2>
            <span className="text-xs text-[var(--text-3)]">{matches.length} match{matches.length !== 1 ? "es" : ""}</span>
          </div>

          {matches.length === 0 ? (
            <div className="card-cinematic-static p-8 text-center">
              <p className="text-[var(--text-3)] text-sm mb-3">No simulations yet.</p>
              <button onClick={() => setShowCreateForm(true)} className="text-sm text-[var(--brand)] hover:underline">
                + Create First Simulation
              </button>
            </div>
          ) : (
            <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="space-y-2">
              {matches.map((m) => {
                const cfg = statusConfig[m.status] || statusConfig.Upcoming;
                return (
                  <motion.div key={m.matchId} variants={gridItem}>
                    <div className="card-cinematic p-4 flex items-center justify-between">
                      <Link href={`/match/${m.matchId}`} className="flex items-center gap-3 min-w-0 flex-1">
                        <GlowBadge color={cfg.color} pulse={m.status === "Live"}>{cfg.label}</GlowBadge>
                        <span className="text-sm font-medium truncate hover:text-[var(--brand)] transition-colors">
                          {m.teamA} vs {m.teamB}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Link href={`/match/${m.matchId}`} className="text-xs text-[var(--brand)] whitespace-nowrap hover:underline">
                          Open →
                        </Link>
                        <button
                          onClick={() => handleDelete(m.matchId)}
                          disabled={deletingId === m.matchId}
                          className="w-7 h-7 rounded-md border border-[var(--border)] bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-3)] hover:text-[var(--danger)] hover:border-[var(--danger)]/30 transition-colors disabled:opacity-50"
                          title="Delete simulation"
                        >
                          {deletingId === m.matchId ? (
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M2 4h12M5.333 4V2.667a1.333 1.333 0 011.334-1.334h2.666a1.333 1.333 0 011.334 1.334V4m2 0v9.333a1.333 1.333 0 01-1.334 1.334H4.667a1.333 1.333 0 01-1.334-1.334V4h9.334z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </section>

        {/* ── Quick Actions ── */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <motion.div variants={staggerGrid} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <motion.div key={action.label} variants={gridItem}>
                <Link href={action.href}>
                  <div className={`card-cinematic group p-4 text-center cursor-pointer ${actionColors[action.color]}`}>
                    <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--surface-3)] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      {action.icon}
                    </div>
                    <p className="text-sm font-medium">{action.label}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Live Hosted Matches ── */}
        {isLoggedIn && liveHostedMatches.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Your Live Hosted Matches</h2>
            <LiveMatchDropdown count={liveMatchCount} matches={liveHostedMatches} />
          </section>
        )}
      </div>
    </main>
  );
}
