"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  useMatchRuns,
  useMatchWickets,
  useMatchOversDisplay,
  useMatchMeta,
  useStriker,
  useNonStriker,
  useLastEvent,
  useCommentary
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
  const matchId = initialMatch.matchId;

  // 🔥 LIVE STATE
  const match = useMatchMeta(matchId);
  const runs = useMatchRuns(matchId);
  const wickets = useMatchWickets(matchId);
  const overs = useMatchOversDisplay(matchId);

  // 🔥 NEW SELECTORS
  const striker = useStriker(matchId);
  const nonStriker = useNonStriker(matchId);
  const lastEvent = useLastEvent(matchId);
  const commentary = useCommentary(matchId) ?? [];

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

  /*
  ====================================================
  ANIMATION STATE
  ====================================================
  */

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

  /*
  ====================================================
  UI
  ====================================================
  */

  return (
    <div
      ref={cardRef}
      onClick={() => router.push(`/match/${matchId}`)}
      className={`
        ui-section relative overflow-hidden
        transition-all duration-200 cursor-pointer
        hover:scale-[1.01] active:scale-[0.99]
        ${status.cinematic}
        ${energy ? "energy-sweep" : ""}
      `}
    >

      {/* HEADER */}
      <div className="ui-section-header !mb-2 !pb-2">

        <h2 className="flex items-center gap-2 text-base font-semibold">
          {initialMatch.teamA} vs {initialMatch.teamB}

          <div className="text-xs text-gray-400">
            Over: {match.currentOver ?? 0}.{match.currentBall ?? 0}
          </div>

          {match.status === "Live" && (
            <span className="live-pulse-red" />
          )}
        </h2>

        <span className={`rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] ${status.text}`}>
          {match.status}
        </span>

      </div>

      {/* 🔥 MOMENTUM BAR */}
      {match.status === "Live" && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded bg-gray-800">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${Math.min((runs ?? 0) / 200 * 100, 100)}%`
            }}
          />
        </div>
      )}

      {/* LIVE */}
      {match.status === "Live" && runs !== undefined && wickets !== undefined && (
        <div className="mt-2 space-y-1">

          {/* SCORE */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Score</span>

            <span ref={scoreRef} className="text-lg font-bold score-tick">
              <AnimatedScore value={`${runs}/${wickets}`} />
            </span>

            {delta && (
              <span ref={deltaRef} className="text-green-500 font-bold" />
            )}
          </div>

          {/* OVERS */}
          {overs && <p className="text-xs text-gray-400">Overs: {overs}</p>}

          {/* RUN RATE */}
          {runRate && (
            <p className="text-xs text-gray-400">Run Rate: {runRate}</p>
          )}

          {/* 🔥 BATSMEN */}
          <div className="mt-2 text-xs text-gray-300">
            🏏 {striker} <span className="text-yellow-400">*</span>
            <br />
            🏃 {nonStriker}
          </div>

          {/* 🔥 LAST BALL */}
          {lastEvent && (
            <div className="mt-2 text-xs text-gray-400">
              Last ball: {lastEvent.type} {lastEvent.runs ?? ""}
            </div>
          )}

          {/* 🔥 COMMENTARY */}
          {commentary.length > 0 && (
  <div className="mt-2 truncate text-xs italic text-gray-400">
    {commentary[0]}
  </div>
)}

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
