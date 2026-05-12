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

export default function HomePage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [teamAInput, setTeamAInput] = useState("");
  const [teamBInput, setTeamBInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  /*
  ========================================
  FETCH MATCHES
  ========================================
  */

  const fetchMatches = async () => {
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

      setMatches(normalized);
    } catch (err) {
      console.error("❌ Failed to fetch matches", err);
    }
  };

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

// Close form when clicking outside
useEffect(() => {
  if (!showCreateForm) return;
  function handleClickOutside(e: MouseEvent) {
    if (formRef.current && !formRef.current.contains(e.target as Node)) {
      setShowCreateForm(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
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

    setShowCreateForm(false);
    setTeamAInput("");
    setTeamBInput("");
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
          className="text-center mb-28"
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
                      {creating ? "Creating..." : "Create and Open Admin"}
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

        {/* LIVE MATCHES */}
        <div className="mb-28">

          <h2 className="text-2xl font-semibold mb-10 text-gray-200">
            Live Matches
          </h2>

          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid md:grid-cols-3 gap-8"
          >
            {matches.length === 0 ? (
              <p className="text-gray-500">No matches available</p>
            ) : (
              matches.slice(0, 3).map((match) => (
                <motion.div key={match.matchId} variants={item} className="relative group">
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
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-red-600 text-gray-400 hover:text-white rounded-lg w-7 h-7 flex items-center justify-center text-xs disabled:opacity-40"
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
