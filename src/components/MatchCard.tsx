"use client";

import { useEffect, useRef, useState } from "react";
import { Match } from "../types/match";
import { getMatch, subscribeMatch } from "@/store/realtimeStore";
import { subscribeTimeline } from "@/services/broadcastTimeline";
import { isBroadcastEnabled } from "@/services/broadcastMode";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export default function MatchCard({ slug }: Props) {

  const router = useRouter();

  const [match, setMatch] = useState<Match | undefined>(
    getMatch(slug)
  );

  const scoreRef = useRef<HTMLSpanElement>(null);

  const [highlight, setHighlight] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);

  // 🔥 LIVE ENERGY SWEEP STATE
  const [energy, setEnergy] = useState(false);

  /*
  =====================================
  STATUS STYLE SYSTEM
  =====================================
  */

  const statusStyle = {
    Live: "text-red-500",
    Upcoming: "text-blue-500",
    Completed: "text-gray-500"
  };

  const statusClass = {
    Live: "live-cinematic",
    Upcoming: "upcoming-cinematic",
    Completed: "completed-cinematic"
  };

  /*
  =====================================
  MATCH STATE SUBSCRIPTION
  =====================================
  */

  useEffect(() => {

    const unsubscribe = subscribeMatch(slug, (updated) => {

      setMatch(updated);

      if (scoreRef.current) {
        scoreRef.current.textContent = updated.score ?? "";
      }

    });

    return unsubscribe;

  }, [slug]);

  /*
  =====================================
  BROADCAST TIMELINE LISTENER
  UI EFFECTS ONLY
  =====================================
  */

  useEffect(() => {

    const unsubscribe = subscribeTimeline((event) => {

      if (event.slug !== slug) return;

      if (!isBroadcastEnabled()) return;

      // highlight animation
      setHighlight(true);
      setTimeout(() => setHighlight(false), 300);

      // delta animation
      if (event.runs > 0) {

        setDelta(event.runs);
        setTimeout(() => setDelta(null), 900);

        // 🔥 ENERGY SWEEP
        setEnergy(true);
        setTimeout(() => setEnergy(false), 600);
      }

    });

    return unsubscribe;

  }, [slug]);

  if (!match) return null;

  return (
    <div
      onClick={() => router.push(`/match/${slug}`)}
      className={`
        border p-4 rounded-xl shadow relative overflow-hidden
        transition-all cursor-pointer hover:scale-[1.02]
        ${statusClass[match.status]}
        ${energy ? "energy-sweep" : ""}
      `}
    >

      {/* HEADER */}
      <h2 className="font-bold flex items-center gap-2">

        {match.team1} vs {match.team2}

        {match.status === "Live" && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
        )}

      </h2>

      {/* SCORE */}
      <div className="relative mt-2">

        <p className={`text-lg font-semibold transition-all duration-300 ${
            highlight ? "bg-yellow-300 scale-110 px-2 rounded" : ""
          }`}
        >
          Score:

          <span ref={scoreRef} className="ml-1">
            {match.score}
          </span>

        </p>

        {delta && (
          <span className="absolute left-28 top-0 text-green-500 font-bold animate-bounce">
            +{delta}
          </span>
        )}

      </div>

      {match.overs && (
        <p className="text-sm mt-1">Overs: {match.overs}</p>
      )}

      {match.runRate && (
        <p className="text-sm">Run Rate: {match.runRate}</p>
      )}

      {/* STATUS BADGE */}
      <span
        className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${statusStyle[match.status]}`}
      >
        {match.status}
      </span>

    </div>
  );
}
