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
import AnimatedScore from "./ui/AnimatedScore";

type Props = {
  match: {
    matchId: string;
    teamA: string;
    teamB: string;
    status: "Live" | "Upcoming" | "Completed";
  };
};

export default function MatchCard({ match: initialMatch }: Props) {

  const router = useRouter();

  // ✅ get live match state
  const match = useMatchMeta(initialMatch.matchId);

  const matchId = initialMatch.matchId;

  const runs = useMatchRuns(matchId);
  const wickets = useMatchWickets(matchId);
  const overs = useMatchOversDisplay(matchId);

  /*
  ====================================================
  RUN RATE
  ====================================================
  */

  let runRate: string | null = null;

  if (match?.status === "Live" && runs !== undefined && overs) {
    const [o, b] = overs.split(".");
    const totalOvers = Number(o) + Number(b) / 6;

    runRate =
      totalOvers > 0 ? (runs / totalOvers).toFixed(2) : "0.00";
  }

  const cardRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const deltaRef = useRef<HTMLSpanElement>(null);

  const [energy, setEnergy] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeAnimation((event: AnimationEvent) => {

      if (["FOUR", "SIX", "WICKET"].includes(event.type)) {
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
  }, []);

  if (!match) return null;

  const statusConfig = {
    Live: { cinematic: "live-cinematic", text: "text-red-500" },
    Upcoming: { cinematic: "upcoming-cinematic", text: "text-blue-500" },
    Completed: { cinematic: "completed-cinematic", text: "text-gray-500" }
  } as const;

  const status = statusConfig[match.status];

  return (
    <div
      ref={cardRef}
      onClick={() => router.push(`/match/${matchId}`)}
      className={`
        border p-5 rounded-xl shadow relative overflow-hidden
        transition-all duration-200 cursor-pointer hover:scale-[1.02]
        ${status.cinematic}
        ${energy ? "energy-sweep" : ""}
      `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">

        <h2 className="font-semibold text-lg flex items-center gap-2">
          {initialMatch.teamA} vs {initialMatch.teamB}

          <div className="text-sm text-gray-400">
            Over: {match.currentOver ?? 0}.{match.currentBall ?? 0}
          </div>

          {match.status === "Live" && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/>
          )}
        </h2>

        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.text}`}>
          {match.status}
        </span>

      </div>

      {/* LIVE */}
      {match.status === "Live" && runs !== undefined && wickets !== undefined && (
        <div className="mt-3 space-y-1">

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">Score</span>

            <span ref={scoreRef} className="text-xl font-bold">
              <AnimatedScore value={`${runs}/${wickets}`} />
            </span>

            {delta && (
              <span ref={deltaRef} className="text-green-500 font-bold" />
            )}
          </div>

          {overs && <p className="text-sm text-gray-400">Overs: {overs}</p>}
          {runRate && <p className="text-sm text-gray-400">Run Rate: {runRate}</p>}
        </div>
      )}

      {/* UPCOMING */}
      {match.status === "Upcoming" && (
        <p className="text-sm mt-3 text-blue-400">Match not started</p>
      )}

      {/* COMPLETED */}
      {match.status === "Completed" && (
        <p className="text-sm mt-3 text-gray-400">Match finished</p>
      )}
    </div>
  );
}