"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getMatches, subscribeStore } from "@/store/realtimeStore";
import MatchCard from "@/components/MatchCard";
import { Match } from "@/types/match";

export default function MatchPage() {

  const [matches, setMatches] = useState<Match[]>(getMatches());

  const [filter, setFilter] = useState<
    "All" | "Live" | "Upcoming" | "Completed"
  >("All");

  // Subscribe to store updates
  useEffect(() => {

    const unsubscribe = subscribeStore((updatedMatches?: Match[]) => {

      const data = updatedMatches ?? getMatches();

      setMatches(prev => {
        if (prev === data) return prev;
        return data;
      });

    });

    return unsubscribe;

  }, []);

  const priority: Record<"Live" | "Upcoming" | "Completed", number> = {
    Live: 1,
    Upcoming: 2,
    Completed: 3
  };

  const sortedMatches = useMemo(() => {
    return [...matches].sort(
      (a, b) => priority[a.status] - priority[b.status]
    );
  }, [matches]);

  const filteredMatches =
    filter === "All"
      ? sortedMatches
      : sortedMatches.filter(match => match.status === filter);


  return (

    <motion.main
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 py-10 space-y-10 text-white"
    >

      {/* HEADER */}

      <div className="flex items-center justify-between">

        <h1 className="text-3xl font-bold tracking-wide">
          Matches
        </h1>

      </div>


      {/* FILTER BAR */}

      <div className="flex gap-3 bg-zinc-900 border border-zinc-800 p-1 rounded-full w-fit">

        {(["All", "Live", "Upcoming", "Completed"] as const).map(tab => {

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
                }
              `}
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
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="space-y-6"
      >

        {filteredMatches.map(match => (

          <motion.div
            key={match.slug}
            variants={{
              hidden: { opacity: 0, y: 15 },
              show: { opacity: 1, y: 0 }
            }}
          >
            <MatchCard slug={match.slug} />
          </motion.div>

        ))}

      </motion.div>

    </motion.main>

  );

}