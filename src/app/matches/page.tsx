"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import MatchCard from "@/components/MatchCard";

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
STABLE PRIORITY (OUTSIDE COMPONENT)
========================================
*/

const priority: Record<"Live" | "Upcoming" | "Completed", number> = {
  Live: 1,
  Upcoming: 2,
  Completed: 3,
};

export default function MatchPage() {
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<
    "All" | "Live" | "Upcoming" | "Completed"
  >("All");

  /*
  ========================================
  FETCH MATCHES (API → NORMALIZE → STATE)
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
    } finally {
      setLoading(false);
    }
  };

  /*
  ========================================
  EFFECT (INITIAL + POLLING)
  ========================================
  */

  useEffect(() => {
    fetchMatches();

    // simple polling (replace later with SSE)
    const interval = setInterval(fetchMatches, 3000);
    return () => clearInterval(interval);
  }, []);

  /*
  ========================================
  SORTING
  ========================================
  */

  const sortedMatches = useMemo(() => {
    return [...matches].sort(
      (a, b) => priority[a.status] - priority[b.status]
    );
  }, [matches]);

  /*
  ========================================
  FILTERING
  ========================================
  */

  const filteredMatches =
    filter === "All"
      ? sortedMatches
      : sortedMatches.filter((m) => m.status === filter);

  /*
  ========================================
  UI
  ========================================
  */

  return (
    <motion.main
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 py-10 space-y-10 text-white"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-wide">Matches</h1>
      </div>

      {/* FILTER BAR */}
      <div className="flex gap-3 bg-zinc-900 border border-zinc-800 p-1 rounded-full w-fit">
        {(["All", "Live", "Upcoming", "Completed"] as const).map((tab) => {
          const getActiveColor = () => {
            if (tab === "Live") return "bg-red-500 text-white";
            if (tab === "Upcoming") return "bg-blue-500 text-white";
            if (tab === "Completed") return "bg-gray-600 text-white";
            return "bg-white text-black";
          };

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300
                ${
                  filter === tab
                    ? `${getActiveColor()} scale-105 shadow-lg`
                    : "text-gray-400 hover:text-white"
                }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* MATCH LIST */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
        className="space-y-6"
      >
        {loading ? (
          <p className="text-gray-400">Loading matches...</p>
        ) : filteredMatches.length === 0 ? (
          <p className="text-gray-500">No matches found</p>
        ) : (
          filteredMatches.map((match) => (
            <motion.div
              key={match.matchId}
              variants={{
                hidden: { opacity: 0, y: 15 },
                show: { opacity: 1, y: 0 },
              }}
            >
              <MatchCard match={match} />
            </motion.div>
          ))
        )}
      </motion.div>
    </motion.main>
  );
}