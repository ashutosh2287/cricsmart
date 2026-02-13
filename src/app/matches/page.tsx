"use client";

import { useEffect, useState } from "react";
import { getMatches, subscribeStore } from "@/store/realtimeStore";
import MatchCard from "../../components/MatchCard";
import { Match } from "../../types/match";

import { startRealtime } from "@/services/realtimeService";

export default function MatchPage() {

  // ⭐ Only used for LIST order (not data rendering)
  const [matches, setMatches] = useState<Match[]>(getMatches());

  const [filter, setFilter] = useState<
    "All" | "Live" | "Upcoming" | "Completed"
  >("All");

  // ⭐ Subscribe ONLY for list changes (add/remove/sort)
  useEffect(() => {

  const unsubscribe = subscribeStore(() => {

    const updatedMatches = getMatches();

    setMatches(updatedMatches);

    // ⭐ IMPORTANT — start realtime when matches exist
    if (updatedMatches.length > 0) {
      startRealtime(updatedMatches);
    }

  });

  return unsubscribe;

}, []);


  // ✅ START REALTIME ENGINE (THIS WAS MISSING)
  useEffect(() => {

    const initialMatches = getMatches();

    startRealtime(initialMatches);

  }, []);

  // ⭐ Priority sorting (Live first)
  const priority: Record<"Live" | "Upcoming" | "Completed", number> = {
    Live: 1,
    Upcoming: 2,
    Completed: 3
  };

  const sortedMatches = [...matches].sort((a, b) => {
    return priority[a.status] - priority[b.status];
  });

  const filteredMatches =
    filter === "All"
      ? sortedMatches
      : sortedMatches.filter((match) => match.status === filter);

  return (
    <main className="p-10 space-y-6">

      <h1 className="text-3xl font-bold">Matches</h1>

      {/* FILTER BUTTONS */}
      <div className="flex gap-4 relative bg-gray-200 p-1 rounded-full w-fit">

        {(["All", "Live", "Upcoming", "Completed"] as const).map((tab) => {

          const getActiveColor = () => {
            if (tab === "Live") return "bg-red-500 text-white";
            if (tab === "Upcoming") return "bg-blue-500 text-white";
            if (tab === "Completed") return "bg-gray-500 text-white";
            return "bg-black text-white";
          };

          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`
                relative z-10 px-5 py-2 rounded-full transition-all duration-300
                ${
                  filter === tab
                    ? `${getActiveColor()} scale-105 shadow-md`
                    : "text-black hover:scale-105"
                }
              `}
            >
              {tab}
            </button>
          );

        })}

      </div>

      {/* MATCH LIST */}
      {filteredMatches.map((match) => (
        <MatchCard
          key={match.slug}
          slug={match.slug}
        />
      ))}

    </main>
  );
}
