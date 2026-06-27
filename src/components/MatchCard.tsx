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
import { Card } from "@/components/ui/Card";
import { CircleDot, ArrowRightLeft } from "lucide-react";

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
    Live: { cinematic: "live-cinematic", text: "text-[var(--danger)]" },
    Upcoming: { cinematic: "upcoming-cinematic", text: "text-[var(--accent-amber)]" },
    Completed: { cinematic: "completed-cinematic", text: "text-[var(--text-muted)]" }
  } as const;

  const status = statusConfig[match.status];

  /*
  ====================================================
  UI
  ====================================================
  */

  return (
    <Card
      hover
      onClick={() => router.push(`/match/${matchId}`)}
      className={`relative cursor-pointer overflow-hidden p-5 transition-all duration-200 ${status.cinematic} ${
        energy ? "energy-sweep" : ""
      }`}
    >

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <h2 className="font-semibold text-lg flex items-center gap-2 text-[var(--text-primary)]">
          {initialMatch.teamA} vs {initialMatch.teamB}

          <div className="text-sm text-[var(--text-muted)]">
            Over: {match.currentOver ?? 0}.{match.currentBall ?? 0}
          </div>

          {match.status === "Live" && (
            <span className="w-2 h-2 bg-[var(--danger)] rounded-full animate-pulse"/>
          )}
        </h2>

        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.text}`}>
          {match.status}
        </span>

      </div>

      {/* 🔥 MOMENTUM BAR */}
      {match.status === "Live" && (
          <div
            className="h-1 w-full mt-2 rounded overflow-hidden"
            style={{ background: "color-mix(in srgb, var(--text-muted) 22%, transparent)" }}
          >
            <div
              className="h-full bg-[var(--accent-brand)] transition-all duration-500"
              style={{
                width: `${Math.min((runs ?? 0) / 200 * 100, 100)}%`
              }}
            />
          </div>
        )}

      {/* LIVE */}
      {match.status === "Live" && runs !== undefined && wickets !== undefined && (
        <div className="mt-3 space-y-1">

          {/* SCORE */}
          <div className="flex items-center gap-3">
            <span className="text-[var(--text-muted)] text-sm">Score</span>

            <span ref={scoreRef} className="text-xl font-bold">
              <AnimatedScore value={`${runs}/${wickets}`} />
            </span>

            {delta && (
              <span ref={deltaRef} className="text-[var(--accent-brand)] font-bold" />
            )}
          </div>

          {/* OVERS */}
          {overs && <p className="text-sm text-[var(--text-muted)]">Overs: {overs}</p>}

          {/* RUN RATE */}
          {runRate && <p className="text-sm text-[var(--text-muted)]">Run Rate: {runRate}</p>}

          {/* BATSMEN */}
          <div className="text-sm text-[var(--text-secondary)] mt-2 space-y-0.5">
            <div className="flex items-center gap-1.5">
              <CircleDot className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>{striker} <span className="text-[var(--accent-amber)]">*</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{nonStriker}</span>
            </div>
          </div>

          {/* 🔥 LAST BALL */}
          {lastEvent && (
            <div className="text-xs text-[var(--text-muted)] mt-2">
              Last ball: {lastEvent.type} {lastEvent.runs ?? ""}
            </div>
          )}

          {/* 🔥 COMMENTARY */}
          {commentary.length > 0 && (
            <div className="text-xs text-[var(--text-muted)] mt-2 italic truncate">
              {commentary[0]}
            </div>
          )}

        </div>
      )}

      {/* UPCOMING */}
      {match.status === "Upcoming" && (
        <p className="text-sm mt-3 text-[var(--accent-amber)]">Match not started</p>
      )}

      {/* COMPLETED */}
      {match.status === "Completed" && (
        <p className="text-sm mt-3 text-[var(--text-muted)]">Match finished</p>
      )}

    </Card>
  );
}
