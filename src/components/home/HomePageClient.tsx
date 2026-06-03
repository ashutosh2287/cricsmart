"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Trophy, Zap, Activity, Users, 
  Settings, Plus, Trash2, ExternalLink, AlertCircle
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/providers/AuthProvider";
import { LiveMatchDropdown } from "@/components/home/LiveMatchDropdown";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ApiMatch = { 
  matchId: string; 
  teamA: string; 
  teamB: string; 
  status: "LIVE" | "UPCOMING" | "COMPLETED"; 
};

type Match = { 
  matchId: string; 
  teamA: string; 
  teamB: string; 
  status: "Live" | "Upcoming" | "Completed"; 
};

type ScoreEntry = { r?: number; w?: number; o?: number; inning?: string };

type RealMatch = {
  id: string; 
  name?: string; 
  status?: string; 
  teams?: string[]; 
  score?: ScoreEntry[]; 
  isLive?: boolean; 
  matchCategory?: string;
  matchType?: string;
};

interface HostedMatch {
  id: string;
  runtimeMatchId: string;
  title: string;
  teamA: string;
  teamB: string;
}

interface HomePageClientProps {
  liveMatchCount: number;
  teamCount: number;
  totalMatchCount: number;
  liveHostedMatches: HostedMatch[];
  isLoggedIn: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatScore(entry: ScoreEntry): string {
  const runs = entry.r ?? 0;
  const wkts = entry.w ?? 0;
  const overs = entry.o ?? 0;
  return `${runs}/${wkts} (${overs} ov)`;
}

export default function HomePageClient({
  liveMatchCount,
  teamCount,
  totalMatchCount,
  liveHostedMatches,
  isLoggedIn,
}: HomePageClientProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<RealMatch[]>([]);
  const [liveStale, setLiveStale] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamAInput, setTeamAInput] = useState("");
  const [teamBInput, setTeamBInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const formRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { authEnabled, isAuthenticated, loading: authLoading } = useAuth();

  // Load Simulations
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/matches");
        const data: ApiMatch[] = await res.json();
        const normalized: Match[] = data.map((m) => ({
          matchId: m.matchId, teamA: m.teamA, teamB: m.teamB,
          status: m.status === "LIVE" ? "Live" : m.status === "COMPLETED" ? "Completed" : "Upcoming",
        }));
        if (mounted) setMatches(normalized);
      } catch {}
    };
    load();
    const interval = setInterval(load, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Load Real Matches
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = await res.json();
        if (!mounted) return;
        const data = Array.isArray(payload.data) ? (payload.data as RealMatch[]) : [];
        setLiveMatches(data.filter((m: RealMatch) => m.isLive));
        setLiveStale(Boolean(payload.stale));
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
    } catch (err) { console.error(err); } finally { setCreating(false); }
  };

  const handleDelete = async (matchId: string) => {
    setDeletingId(matchId);
    try {
      await fetch("/api/matches/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
    } catch {} finally { setDeletingId(null); }
  };

  return (
    <div className="cs-theme-wrapper">
      <style>{`
        .cs-theme-wrapper {
          --primary: #00E5FF;
          --bg-dark: #040A14;
          --card-bg: #0A1220;
          --border: rgba(255,255,255,0.06);
          background: var(--bg-dark);
          color: white;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          padding: 2rem 1rem;
        }
        .cs-container {
          max-w: 1100px;
          margin: 0 auto;
        }
        .cs-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cs-card:hover { 
          border-color: rgba(0, 229, 255, 0.3);
          background: #0d192d;
        }
        .cs-input {
          background: #111B2B;
          border: 1px solid var(--border);
          color: white;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          width: 100%;
          outline: none;
        }
        .cs-input:focus {
          border-color: var(--primary);
        }
        .cs-btn-primary {
          background: var(--primary);
          color: black;
          font-weight: 700;
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .cs-btn-primary:hover { opacity: 0.9; }
        .cs-pulse {
          width: 8px;
          height: 8px;
          background: #FF3B3B;
          border-radius: 50%;
          display: inline-block;
          animation: pulse-red 1.5s infinite;
          margin-right: 8px;
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(255, 59, 59, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(255, 59, 59, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 59, 59, 0); }
        }
        .cs-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: background 0.2s;
        }
        .cs-row-item:hover {
          background: rgba(255, 255, 255, 0.04);
        }
      `}</style>

      <div className="cs-container">
        {/* ── Header Area ──────────────────────────────────── */}
        <header className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CricSmart</h1>
            <p className="text-slate-500 text-xs mt-0.5">Real-Time Cricket Intelligence</p>
          </div>
          <div className="flex gap-3 items-center">
            <ThemeToggle />
            <Link
              href="/matches"
              className="text-xs px-4 py-2 rounded-lg border border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white transition"
            >
              All Matches
            </Link>
            <button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="cs-btn-primary text-xs"
              aria-label="Create new simulation"
            >
              <Plus size={16} /> New Simulation
            </button>
          </div>
        </header>

        {/* ── Configuration Form ────────────────────────────── */}
        {showCreateForm && (
          <div className="cs-card mb-8 border-cyan-500/30 bg-cyan-950/10">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Activity size={16} className="text-cyan-400"/> Configure Simulation Engine</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                className="cs-input text-sm" 
                placeholder="Team A Name" 
                value={teamAInput} 
                onChange={(e) => setTeamAInput(e.target.value)}
              />
              <input 
                className="cs-input text-sm" 
                placeholder="Team B Name" 
                value={teamBInput} 
                onChange={(e) => setTeamBInput(e.target.value)}
              />
              <button 
                onClick={handleCreateMatch}
                disabled={creating}
                className="cs-btn-primary justify-center text-sm"
              >
                {creating ? "Launching..." : "Start Engine"}
              </button>
            </div>
          </div>
        )}

        {/* ── Stats Bar ─────────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <LiveMatchDropdown count={liveMatchCount} matches={liveHostedMatches} />
          <div className="cs-card py-3 px-4 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Teams</p>
              <p className="text-xl font-bold mt-0.5">{teamCount}</p>
            </div>
            <Users className="text-cyan-400 opacity-20" size={24} />
          </div>
          <div className="cs-card py-3 px-4 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Hosted Matches</p>
              <p className="text-xl font-bold mt-0.5">{totalMatchCount}</p>
            </div>
            <Trophy className="text-cyan-400 opacity-20" size={24} />
          </div>
        </section>

        {/* ── Live Now ──────────────────────────────────────── */}
        <section className="cs-card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] flex items-center text-slate-300">
              <span className="cs-pulse"></span> Live Now
              {liveMatches.length > 0 && (
                <span className="ml-2 bg-red-950 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-mono">
                  {liveMatches.length}
                </span>
              )}
            </h2>
            <Link href="/matches" className="text-xs text-slate-500 hover:text-slate-300 transition">
              View all →
            </Link>
          </div>

          {liveStale && (
            <p className="text-[11px] text-amber-500 mb-3 flex items-center gap-1">
              <AlertCircle size={12}/> Scores may be delayed
            </p>
          )}

          {liveMatches.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No live matches right now. Check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.slice(0, 6).map(m => {
                const scores = Array.isArray(m.score) ? m.score : [];
                return (
                  <Link key={m.id} href={`/matches/${m.id}`} className="p-4 rounded-xl border border-slate-800/60 bg-slate-900/30 hover:border-cyan-500/40 transition group block">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mb-2 font-mono uppercase tracking-wider">
                      <span>{m.matchCategory || m.matchType || 'Domestic'}</span>
                      <span className="text-red-500 font-semibold group-hover:text-cyan-400 transition flex items-center gap-1">
                        LIVE <ExternalLink size={10}/>
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-200 mb-2 truncate">
                      {m.name?.replace(/\s+vs\s+/i, " vs ")}
                    </div>
                    {scores.length > 0 && (
                      <div className="space-y-0.5 border-t border-slate-800/40 pt-2 mt-2">
                        {scores.slice(0, 2).map((s, idx) => (
                          <p key={idx} className="text-xs font-mono text-slate-400 tabular-nums">
                            {formatScore(s)}
                          </p>
                        ))}
                      </div>
                    )}
                    {m.status && <p className="text-[11px] text-slate-500 mt-2 truncate">{m.status}</p>}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Your Simulations ──────────────────────────────── */}
        <section className="cs-card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
              Your Simulations
            </h2>
            {matches.length > 0 && (
              <span className="text-[11px] text-slate-500 font-mono">
                {matches.length} match{matches.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {matches.map(m => (
              <div key={m.matchId} className="cs-row-item">
                <Link href={`/match/${m.matchId}`} className="flex items-center gap-3 flex-1 min-w-0">
                  {m.status === "Live" && <span className="cs-pulse !margin-0"></span>}
                  <span className="font-semibold text-sm text-slate-200 truncate">
                    {m.teamA} vs {m.teamB}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ml-2 ${
                    m.status === 'Live' ? 'text-red-500' : m.status === 'Completed' ? 'text-slate-500' : 'text-cyan-400'
                  }`}>
                    {m.status}
                  </span>
                </Link>
                <div className="flex items-center gap-2 ml-4">
                  <Link 
                    href={`/match/${m.matchId}`}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white transition"
                  >
                    Open →
                  </Link>
                  <button 
                    onClick={() => handleDelete(m.matchId)}
                    disabled={deletingId === m.matchId}
                    className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-500 hover:text-red-400 hover:border-red-900/50 transition"
                    aria-label={`Delete simulation ${m.teamA} vs ${m.teamB}`}
                    title="Delete Simulation"
                  >
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
            {matches.length === 0 && (
              <div className="text-center py-6">
                <p className="text-slate-500 text-xs italic mb-3">No active simulation matrices generated yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="text-xs text-cyan-400 border border-cyan-950 bg-cyan-950/20 px-3 py-1.5 rounded-lg hover:bg-cyan-900/30 transition"
                >
                  + Spawn Simulation Thread
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Quick Actions ─────────────────────────────────── */}
        <section className="cs-card mb-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link
              href="/host/matches/create"
              className="p-3 text-center text-xs font-medium rounded-xl border border-slate-800 bg-slate-900/30 text-slate-300 hover:border-cyan-500/30 hover:text-white transition block"
            >
              Host Match
            </Link>
            <Link
              href="/account/teams"
              className="p-3 text-center text-xs font-medium rounded-xl border border-slate-800 bg-slate-900/30 text-slate-300 hover:border-cyan-500/30 hover:text-white transition block"
            >
              Manage Teams
            </Link>
            <Link
              href="/account/tournaments"
              className="p-3 text-center text-xs font-medium rounded-xl border border-slate-800 bg-slate-900/30 text-slate-300 hover:border-cyan-500/30 hover:text-white transition block"
            >
              Tournaments
            </Link>
            <Link
              href="/account/saved"
              className="p-3 text-center text-xs font-medium rounded-xl border border-slate-800 bg-slate-900/30 text-slate-300 hover:border-cyan-500/30 hover:text-white transition block"
            >
              Saved Items
            </Link>
          </div>
        </section>

        {/* ── Recent Activity Snapshot ──────────────────────── */}
        {isLoggedIn && (
          <section className="cs-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">
                Recent Activity Snapshot
              </h2>
              <Link href="/account/activity" className="text-xs text-slate-500 hover:text-slate-300 transition">
                Open feed →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl px-4 py-3 bg-slate-900/40 border border-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Live Now</p>
                <p className="mt-1 text-xl font-bold text-slate-200 font-mono">{liveMatches.length}</p>
              </div>
              <div className="rounded-xl px-4 py-3 bg-slate-900/40 border border-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Simulations</p>
                <p className="mt-1 text-xl font-bold text-slate-200 font-mono">{matches.length}</p>
              </div>
              <div className="rounded-xl px-4 py-3 bg-slate-900/40 border border-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Feed Status</p>
                <p className={`mt-1 text-xs font-semibold ${liveStale ? "text-amber-400" : "text-emerald-400"}`}>
                  {liveStale ? "Delayed data stream" : "Up to date"}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}