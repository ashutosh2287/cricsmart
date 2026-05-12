"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/*
========================================
TYPES
========================================
*/

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
  matchType?: string;
  matchCategory?: string;
  status?: string;
  venue?: string;
  date?: string;
  dateTimeGMT?: string;
  teams?: string[];
  teamInfo?: { name?: string; shortname?: string }[];
  score?: ScoreEntry[];
  isLive?: boolean;
  isCompleted?: boolean;
};

/*
========================================
ANIMATION
========================================
*/

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0 },
};

/*
========================================
HELPERS
========================================
*/

function getTeamNames(match: RealMatch): [string, string] {
  const a =
    match.teamInfo?.[0]?.name ??
    match.teams?.[0] ??
    (match.name ?? "").split(/\s+vs\s+/i)[0]?.trim() ??
    "Team A";
  const b =
    match.teamInfo?.[1]?.name ??
    match.teams?.[1] ??
    (match.name ?? "").split(/\s+vs\s+/i)[1]?.trim() ??
    "Team B";
  return [a, b];
}

function formatScoreEntry(entry: ScoreEntry): string {
  const runs = entry.r ?? 0;
  const wickets = entry.w ?? 0;
  const overs = entry.o ?? 0;
  return `${runs}/${wickets} (${overs} ov)`;
}

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<RealMatch[]>([]);
  const [liveStale, setLiveStale] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamAInput, setTeamAInput] = useState("");
  const [teamBInput, setTeamBInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function closeCreateForm() {
    setShowCreateForm(false);
    setTeamAInput("");
    setTeamBInput("");
  }

  /*
  ========================================
  FETCH SIMULATED MATCHES
  ========================================
  */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch("/api/matches");
        const data: ApiMatch[] = await res.json();

        const normalized: Match[] = data.map((m) => {
          let status: Match["status"];

          if (m.status === "LIVE") status = "Live";
          else if (m.status === "COMPLETED") status = "Completed";
          else status = "Upcoming";

          return {
            matchId: m.matchId,
            teamA: m.teamA,
            teamB: m.teamB,
            status,
          };
        });

        if (mounted) setMatches(normalized);

      } catch (err) {
        console.error("❌ Failed to fetch matches", err);
      }
    };

    load();

    const interval = setInterval(load, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  /*
  ========================================
  FETCH LIVE (REAL) MATCHES
  ========================================
  */

  useEffect(() => {
    let mounted = true;
    const liveSnap = { current: [] as RealMatch[] };

    const load = async () => {
      try {
        const res = await fetch("/api/live/fixtures", { cache: "no-store" });
        const payload = (await res.json()) as { data?: RealMatch[]; stale?: boolean };
        if (!mounted) return;

        const data = Array.isArray(payload.data) ? payload.data : [];
        const live = data.filter((m) => m.isLive);
        liveSnap.current = live;
        setLiveMatches(live);
        setLiveStale(Boolean(payload.stale));
      } catch {
        if (!mounted) return;
        if (liveSnap.current.length > 0) {
          setLiveMatches(liveSnap.current);
          setLiveStale(true);
        }
      }
    };

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

// Close form when clicking outside
useEffect(() => {
  if (!showCreateForm) return;
  function handleClickOutside(e: MouseEvent) {
    if (formRef.current && !formRef.current.contains(e.target as Node)) {
      closeCreateForm();
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, [showCreateForm]);

useEffect(() => {
  if (!showCreateForm) return;
  const onEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      closeCreateForm();
    }
  };
  document.addEventListener("keydown", onEscape);
  return () => document.removeEventListener("keydown", onEscape);
}, [showCreateForm]);

const router = useRouter();

const handleCreateMatch = async () => {
  const teamA = teamAInput.trim() || "Team A";
  const teamB = teamBInput.trim() || "Team B";

  setCreating(true);
  try {
    const res = await fetch("/api/create-match", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamA, teamB }),
    });

    const data = await res.json();

    if (!data?.matchId) {
      throw new Error("Match creation failed");
    }

    closeCreateForm();
    router.push(`/admin/${data.matchId}`);
  } catch (err) {
    console.error("❌ ERROR:", err);
  } finally {
    setCreating(false);
  }
};

const handleDeleteMatch = async (matchId: string) => {
  setDeletingId(matchId);
  try {
    await fetch("/api/matches/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId }),
    });
    setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
  } catch (err) {
    console.error("❌ Failed to delete match", err);
  } finally {
    setDeletingId(null);
  }
};

  /*
  ========================================
  UI
  ========================================
  */

  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-purple-600/20 blur-[160px] rounded-full"/>
      <div className="absolute top-40 left-20 w-[600px] h-[600px] bg-blue-600/20 blur-[140px] rounded-full"/>
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-black to-black"/>

      <div className="relative max-w-7xl mx-auto px-6 py-16">

        {/* HERO */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            CricSmart
          </h1>

          <p className="text-gray-300 text-xl mb-6">
            Real-Time Cricket Intelligence Platform
          </p>

          <p className="text-gray-500 max-w-2xl mx-auto mb-10 text-sm">
            Analyze cricket matches with advanced analytics.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">

            <Link
              href="/matches"
              className="inline-block bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-xl font-semibold"
            >
              View Matches
            </Link>

            <div className="relative" ref={formRef}>
              <button
                onClick={() => setShowCreateForm((v) => !v)}
                className="inline-block bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-xl font-semibold"
              >
                Create Match
              </button>

              {showCreateForm && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 z-50 bg-zinc-900 border border-zinc-700 rounded-xl p-5 w-72 shadow-xl text-left">
                  <p className="text-sm font-semibold text-gray-200 mb-3">New Match</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Team A</label>
                      <input
                        type="text"
                        value={teamAInput}
                        onChange={(e) => setTeamAInput(e.target.value)}
                        placeholder="e.g. India"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Team B</label>
                      <input
                        type="text"
                        value={teamBInput}
                        onChange={(e) => setTeamBInput(e.target.value)}
                        placeholder="e.g. Australia"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      onClick={handleCreateMatch}
                      disabled={creating}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    >
                      {creating ? "Creating..." : "Create Match"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {matches.length > 0 && (() => {
              const targetMatch =
                matches.find(m => m.status === "Live") ||
                matches.find(m => m.status === "Upcoming") ||
                matches[0];

              return (
                <Link
                  href={`/admin/${targetMatch.matchId}`}
                  className="inline-block bg-purple-600 hover:bg-purple-500 px-8 py-3 rounded-xl font-semibold"
                >
                  Open Admin Panel
                </Link>
              );
            })()}

          </div>

        </motion.div>

        {/* SECTION 1: LIVE NOW (real cricAPI matches) */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-200">Live Now</h2>
            <Link href="/matches" className="text-sm text-blue-400 hover:underline">
              View all →
            </Link>
          </div>

          {liveStale && (
            <p className="text-xs text-amber-300 mb-3">Scores may be delayed</p>
          )}

          {liveMatches.length === 0 ? (
            <p className="text-gray-500 text-sm">No live matches right now. Check back soon.</p>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid md:grid-cols-3 gap-6"
            >
              {liveMatches.slice(0, 6).map((match) => {
                const [teamA, teamB] = getTeamNames(match);
                const category = match.matchCategory ?? match.matchType?.toUpperCase() ?? "T20";
                const scores = Array.isArray(match.score) ? match.score : [];

                return (
                  <motion.div key={match.id} variants={item}>
                    <Link href={`/matches/${match.id}`}>
                      <div className="block rounded-xl p-5 bg-zinc-900 border border-red-500/30 live-cinematic hover:scale-[1.02] transition-transform">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-gray-300 uppercase font-medium">
                            {category}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-red-400">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                            </span>
                            LIVE
                          </span>
                        </div>

                        <p className="font-semibold text-sm mb-2">
                          {teamA} vs {teamB}
                        </p>

                        {scores.length > 0 && (
                          <div className="space-y-0.5">
                            {scores.map((s, i) => (
                              <p key={i} className="text-sm font-mono text-gray-300">
                                {formatScoreEntry(s)}
                              </p>
                            ))}
                          </div>
                        )}

                        {match.status && (
                          <p className="text-xs text-gray-400 mt-2 truncate">{match.status}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* SECTION 2: YOUR SIMULATIONS */}
        <div className="mb-20">

          <h2 className="text-2xl font-semibold mb-6 text-gray-200">
            Your Simulations
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-3 gap-8"
          >
            {matches.length === 0 ? (
              <p className="text-gray-500">No simulations yet. Create one above.</p>
            ) : (
              matches.slice(0, 3).map((match) => (
                <motion.div key={match.matchId} variants={item} className="relative">
                  <Link
                    href={`/match/${match.matchId}`}
                    className={`block rounded-xl p-6 bg-zinc-900 transition-all hover:scale-105
                      ${
                        match.status === "Live"
                          ? "border border-red-500 hover:shadow-red-500/30"
                          : match.status === "Upcoming"
                          ? "border border-blue-500"
                          : "border border-zinc-700"
                      }`}
                  >
                    <p className="text-lg font-semibold">
                      {match.teamA} vs {match.teamB}
                    </p>

                    <p
                      className={`text-sm mt-2 flex items-center gap-1.5 ${
                        match.status === "Live"
                          ? "text-red-400"
                          : match.status === "Upcoming"
                          ? "text-blue-400"
                          : "text-gray-400"
                      }`}
                    >
                      {match.status === "Live" && (
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"/>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"/>
                        </span>
                      )}
                      {match.status}
                    </p>
                  </Link>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => handleDeleteMatch(match.matchId)}
                    disabled={deletingId === match.matchId}
                    title="Remove match"
                    aria-label={`Remove ${match.teamA} vs ${match.teamB}`}
                    className="absolute z-10 top-3 right-3 opacity-80 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-400 transition-opacity bg-zinc-800 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg w-7 h-7 flex items-center justify-center text-xs disabled:opacity-40"
                  >
                    {deletingId === match.matchId ? "…" : "✕"}
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>

        {/* FEATURES (UNCHANGED) */}
        <div>
          <h2 className="text-2xl font-semibold mb-10 text-gray-200">
            Platform Features
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-4 gap-8"
          >
            <motion.div variants={item} className="bg-zinc-900 p-6 rounded-xl">
              Win Probability
            </motion.div>

            <motion.div variants={item} className="bg-zinc-900 p-6 rounded-xl">
              Momentum Engine
            </motion.div>

            <motion.div variants={item} className="bg-zinc-900 p-6 rounded-xl">
              Turning Points
            </motion.div>

            <motion.div variants={item} className="bg-zinc-900 p-6 rounded-xl">
              Replay Timeline
            </motion.div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}
