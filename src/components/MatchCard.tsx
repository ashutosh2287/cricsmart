"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getMatches } from "@/store/realtimeStore";

import {
  useMatchRuns,
  useMatchWickets,
  useMatchOvers
} from "@/services/matchSelectors";

import {
  subscribeAnimation,
  AnimationEvent
} from "@/services/animationBus";

import { playAnimation } from "@/services/animationController";

type Props = {
  slug: string;
};

export default function MatchCard({ slug }: Props) {

  const router = useRouter();

  /*
  ====================================================
  MATCH METADATA (teams / status)
  ====================================================
  */

  const match = getMatches().find(m => m.slug === slug);

  /*
  ====================================================
  MATCH ENGINE DATA (score authority)
  ====================================================
  */

  const runs = useMatchRuns(slug);
  const wickets = useMatchWickets(slug);
  const overs = useMatchOvers(slug);

  /*
  ====================================================
  DOM REFS
  ====================================================
  */

  const cardRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const deltaRef = useRef<HTMLSpanElement>(null);

  /*
  ====================================================
  UI STATE (ONLY FOR VISUAL FX)
  ====================================================
  */

  const [energy, setEnergy] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);

  /*
  ====================================================
  ANIMATION BUS LISTENER
  ====================================================
  */

  useEffect(() => {

    const unsubscribe = subscribeAnimation((event: AnimationEvent) => {
      console.log("ANIMATION EVENT RECEIVED:", event);

    if (
  event.type === "FOUR" ||
  event.type === "SIX" ||
  event.type === "WICKET"
) {
  playAnimation(scoreRef.current, "score-highlight", 300);
}

      // ENERGY SWEEP
      if (event.type === "ENERGY_SWEEP") {

        setEnergy(true);
        playAnimation(cardRef.current, "energy-sweep", 600);

        setTimeout(() => setEnergy(false), 600);
      }

      // DELTA POP
      if (event.type === "DELTA") {

        setDelta(event.value);

        if (deltaRef.current) {
          deltaRef.current.textContent = `+${event.value}`;
          playAnimation(deltaRef.current, "delta-bounce", 900);
        }

        setTimeout(() => setDelta(null), 900);
      }

    });

    return unsubscribe;

  }, [slug]);

  if (!match || runs === undefined || wickets === undefined) return null;

  /*
  ====================================================
  STATUS STYLE SYSTEM
  ====================================================
  */

  const statusConfig = {
    Live: {
      cinematic: "live-cinematic",
      text: "text-red-500"
    },
    Upcoming: {
      cinematic: "upcoming-cinematic",
      text: "text-blue-500"
    },
    Completed: {
      cinematic: "completed-cinematic",
      text: "text-gray-500"
    }
  };

  const status = statusConfig[match.status];

  /*
  ====================================================
  RENDER
  ====================================================
  */

  return (
    <div
      ref={cardRef}
      onClick={() => router.push(`/match/${slug}`)}
      className={`
        border p-4 rounded-xl shadow relative overflow-hidden
        transition-all cursor-pointer hover:scale-[1.02]
        ${status.cinematic}
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

  <p className="text-lg font-semibold transition-all duration-300">
    Score:
    <span
      ref={scoreRef}
      className="ml-1 inline-block"
    >
      {runs}/{wickets}
    </span>
  </p>

  {delta && (
    <span
      ref={deltaRef}
      className="absolute left-28 top-0 text-green-500 font-bold pointer-events-none"
    />
  )}

</div>

      {overs && (
        <p className="text-sm mt-1">Overs: {overs}</p>
      )}

      {match.runRate && (
        <p className="text-sm">Run Rate: {match.runRate}</p>
      )}

      {/* STATUS BADGE */}
      <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${status.text}`}>
        {match.status}
      </span>

    </div>
  );
}