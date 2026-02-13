"use client";

import { useEffect, useRef, useState } from "react";
import { Match } from "../types/match";
import { getMatch, subscribeMatch } from "@/store/realtimeStore";
import { publishAnimation } from "@/services/animationBus";
import { isBroadcastEnabled } from "@/services/broadcastMode";
import { useRouter } from "next/navigation";

type Props = {
  slug: string;
};

export default function MatchCard({ slug }: Props) {

  const router = useRouter();

  // ⭐ Static match info
  const [match] = useState<Match | undefined>(
    getMatch(slug)
  );

  const scoreRef = useRef<HTMLSpanElement>(null);

  const [highlight, setHighlight] = useState(false);
  const [delta, setDelta] = useState<number | null>(null);

  const prevScore = useRef(match?.score);

  // ⭐ Realtime subscription (ZERO RENDER)
  useEffect(() => {

    const unsubscribe = subscribeMatch(slug, (updated) => {

      const oldScore = prevScore.current;
      const newScore = updated.score;

      if (!newScore) return;

      // ⭐ DIRECT DOM UPDATE (zero render)
      if (scoreRef.current) {
        scoreRef.current.textContent = newScore;
      }

      if (oldScore) {

        const [oldRunsStr, oldWicketsStr] = oldScore.split("/");
        const [newRunsStr, newWicketsStr] = newScore.split("/");

        const oldRuns = parseInt(oldRunsStr);
        const newRuns = parseInt(newRunsStr);

        const oldWickets = parseInt(oldWicketsStr);
        const newWickets = parseInt(newWicketsStr);

        const diff = newRuns - oldRuns;

        // ⭐ DELTA animation (allowed everywhere)
       // 🔥 Only animate in broadcast mode (match detail live tab)
if (isBroadcastEnabled()) {

  // DELTA animation
  if (diff > 0) {

    setDelta(diff);

    setTimeout(() => setDelta(null), 900);

  }

  // HIGHLIGHT animation
  if (oldScore !== newScore) {

    setHighlight(true);

    setTimeout(() => {
      setHighlight(false);
    }, 300);

  }

}


        // 🔥 CINEMATIC EVENTS ONLY IN BROADCAST MODE
        if (isBroadcastEnabled()) {

          if (diff === 6) {
            publishAnimation({ type: "SIX" });
          }

          if (diff === 4) {
            publishAnimation({ type: "FOUR" });
          }

          if (newWickets > oldWickets) {
            publishAnimation({ type: "WICKET" });
          }

        }

      }

      prevScore.current = newScore;

    });

    return unsubscribe;

  }, [slug]);

  if (!match) return null;

  return (
    <div
      onClick={() => router.push(`/match/${slug}`)}
      className="border p-4 rounded-xl shadow relative overflow-hidden transition-all cursor-pointer hover:scale-[1.02]"
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

        <p
          className={`text-lg font-semibold transition-all duration-300 ${
            highlight ? "bg-yellow-300 scale-110 px-2 rounded" : ""
          }`}
        >

          Score:

          <span ref={scoreRef} className="ml-1">
            {match.score}
          </span>

        </p>

        {/* DELTA ANIMATION */}
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

      <span className="text-sm">{match.status}</span>

    </div>
  );
}
