"use client";

import { useEffect, useMemo, useState } from "react";
import { getMatches, subscribeStore } from "@/store/realtimeStore";
import MatchCard from "../../components/MatchCard";
import { Match } from "../../types/match";

export default function MatchPage() {

  // ⭐ UI list only
  const [matches, setMatches] = useState<Match[]>(getMatches());

  const [filter, setFilter] = useState<
    "All" | "Live" | "Upcoming" | "Completed"
  >("All");

  // ✅ Subscribe ONLY to store changes
  useEffect(() => {

    const unsubscribe = subscribeStore((updatedMatches?: Match[]) => {

      const data = updatedMatches ?? getMatches();

      setMatches(prev => {
        if (prev === data) return prev; // prevent useless re-render
        return data;
      });

    });

    return unsubscribe;

  }, []);

  // ✅ Start realtime ONCE
  useEffect(() => {

    const initialMatches = getMatches();

    if (initialMatches.length > 0) {
    }

  }, []);

  // ⭐ Priority map
  const priority: Record<"Live" | "Upcoming" | "Completed", number> = {
    Live: 1,
    Upcoming: 2,
    Completed: 3
  };

  // ✅ Memoized sorting
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
    <main className="p-10 space-y-6">

      <h1 className="text-3xl font-bold">Matches</h1>

      {/* FILTER BUTTONS */}
      <div className="flex gap-4 relative bg-gray-200 p-1 rounded-full w-fit">
        {(["All", "Live", "Upcoming", "Completed"] as const).map(tab => {

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
      {filteredMatches.map(match => (
        <MatchCard
          key={match.slug}
          slug={match.slug}
        />
      ))}

    </main>
  );
}
