"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useMatchRuns,
  useMatchWickets,
  useMatchOversDisplay,
  useMatchMeta
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

  const match = useMatchMeta(slug);

  const runs = useMatchRuns(slug);
  const wickets = useMatchWickets(slug);
  const overs = useMatchOversDisplay(slug);

  /*
  ====================================================
  DERIVED RUN RATE (LIVE ONLY)
  ====================================================
  */

  let runRate: string | null = null;

  if (match?.status === "Live" && runs !== undefined && overs) {

    const [overPart, ballPart] = overs.split(".");
    const overNum = Number(overPart);
    const ballNum = Number(ballPart);

    const totalOvers = overNum + ballNum / 6;

    runRate =
      totalOvers > 0
        ? (runs / totalOvers).toFixed(2)
        : "0.00";
  }

  const cardRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const deltaRef = useRef<HTMLSpanElement>(null);

  const [energy, setEnergy] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {

    const unsubscribe = subscribeAnimation((event: AnimationEvent) => {

      if (
        event.type === "FOUR" ||
        event.type === "SIX" ||
        event.type === "WICKET"
      ) {
        playAnimation(scoreRef.current, "score-highlight", 300);
      }

      if (event.type === "ENERGY_SWEEP") {
        setEnergy(true);
        playAnimation(cardRef.current, "energy-sweep", 600);
        setTimeout(() => setEnergy(false), 600);
      }

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

  if (!match) return null;

  const statusConfig: Record<
  "Live" | "Upcoming" | "Completed",
  { cinematic: string; text: string }
> = {
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

  return (
    <div
      ref={cardRef}
      onClick={() => router.push(`/match/${match.slug}`)}
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

      {/* LIVE MATCH UI */}
      {match.status === "Live" && runs !== undefined && wickets !== undefined && (

        <>
          <div className="relative mt-2">

            <p className="text-lg font-semibold">
              Score:
              <span ref={scoreRef} className="ml-1 inline-block">
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

          {runRate && (
            <p className="text-sm">Run Rate: {runRate}</p>
          )}
        </>
      )}

      {/* UPCOMING UI */}
      {match.status === "Upcoming" && (
        <p className="text-sm mt-2 text-blue-400">
          Match not started
        </p>
      )}

      {/* COMPLETED UI */}
      {match.status === "Completed" && (
        <p className="text-sm mt-2 text-gray-400">
          Match Finished
        </p>
      )}

      <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs font-semibold ${status.text}`}>
        {match.status}
      </span>

    </div>
  );
}