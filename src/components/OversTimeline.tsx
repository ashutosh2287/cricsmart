"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatchSelector } from "@/services/matchSelectors";
import type { BallEvent } from "@/types/ballEvent";
import { initReplay, seekNextSix, seekNextWicket, seekToOver } from "@/services/replay/replayController";
import { commentaryArrivalVariants } from "@/animations/live-animations";

type Props = {
  slug: string;
};

type InningsSlice = {
  battingTeam?: string;
  overs?: Record<number, BallEvent[]>;
};

function getOutcome(ball: BallEvent) {
  if (ball.type === "WICKET" || ball.wicket) return "W";
  if (ball.extraType === "WD") return "Wd";
  if (ball.extraType === "NB") return "Nb";
  const totalRuns = ball.totalRuns ?? ball.runs ?? 0;
  if (totalRuns === 0) return "•";
  return String(totalRuns);
}

function getOutcomeTone(outcome: string) {
  if (outcome === "W") return "bg-red-500/20 border-red-400/35 text-red-300";
  if (outcome === "6") return "bg-amber-500/20 border-amber-400/35 text-amber-300";
  if (outcome === "4") return "bg-sky-500/20 border-sky-400/35 text-sky-300";
  if (outcome === "•") return "bg-white/[0.03] border-white/10 text-white/65";
  if (outcome === "Wd" || outcome === "Nb") return "bg-orange-500/15 border-orange-400/25 text-orange-300";
  return "bg-emerald-500/15 border-emerald-400/25 text-emerald-300";
}

function getPressureTag(runs: number, wickets: number) {
  if (wickets >= 2) return { label: "Pressure ++", cls: "border-red-400/40 bg-red-500/15 text-red-200" };
  if (wickets === 1 || runs <= 3) return { label: "Pressure +", cls: "border-amber-400/35 bg-amber-500/12 text-amber-200" };
  if (runs >= 12) return { label: "Release", cls: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200" };
  return { label: "Stable", cls: "border-white/15 bg-white/[0.04] text-white/70" };
}

function InningsRow({
  innings,
  title,
  onJumpOver,
}: {
  innings?: InningsSlice;
  title: string;
  onJumpOver: (overIndex: number) => void;
}) {
  const overs = !innings?.overs
    ? []
    : Object.keys(innings.overs)
        .map(Number)
        .filter((value) => Number.isFinite(value))
        .sort((a, b) => a - b);

  if (!overs.length) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/55">
        {title}: no overs yet.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <span className="text-xs text-white/50">
          {innings?.battingTeam ?? "Team"} · {overs.length} overs
        </span>
      </div>

      <div className="sports-scrollbar overflow-x-auto pb-1">
        <div className="flex min-w-max snap-x snap-mandatory gap-2.5">
          {overs.map((overNumber) => {
            const balls = innings?.overs?.[overNumber] ?? [];
            const tokens = balls.map(getOutcome);
            const runs = balls.reduce(
              (sum, ball) => sum + (ball.totalRuns ?? ball.runs ?? 0),
              0
            );
            const wickets = balls.filter((ball) => ball.type === "WICKET" || ball.wicket).length;
            const boundaries = balls.filter((ball) => (ball.runs ?? 0) === 4 || (ball.runs ?? 0) === 6).length;
            const pressure = getPressureTag(runs, wickets);

            return (
              <motion.div
                key={`${title}-${overNumber}`}
                className="w-[172px] shrink-0 snap-start rounded-xl border border-white/10 bg-white/[0.03] p-2.5 transition-transform duration-200 hover:-translate-y-0.5"
                variants={commentaryArrivalVariants}
                initial="initial"
                animate="animate"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">Over {overNumber + 1}</span>
                  <button
                    type="button"
                    onClick={() => onJumpOver(overNumber)}
                    className="rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-sky-200"
                  >
                    Jump
                  </button>
                </div>

                <div className="mb-1.5 flex flex-wrap gap-1 text-[10px]">
                  <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-white/80">{runs} runs</span>
                  {!!wickets && <span className="rounded-md border border-red-400/35 bg-red-500/12 px-1.5 py-0.5 text-red-200">{wickets} wk</span>}
                  {!!boundaries && <span className="rounded-md border border-amber-400/35 bg-amber-500/12 px-1.5 py-0.5 text-amber-200">{boundaries} bdy</span>}
                </div>

                <div className={`mb-2 rounded-md border px-2 py-1 text-[10px] ${pressure.cls}`}>{pressure.label}</div>

                <div className="flex flex-wrap gap-1">
                  {tokens.map((token, index) => (
                    <span
                      key={`${overNumber}-${index}`}
                      className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold ${getOutcomeTone(
                        token
                      )}`}
                    >
                      {token}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OversTimeline({ slug }: Props) {
  const innings = useMatchSelector<InningsSlice[] | undefined>(
    slug,
    (m) => m?.innings
  );
  const [currentReplayIndex, setCurrentReplayIndex] = useState(0);

  const hasOvers = useMemo(
    () => Boolean((innings?.[0]?.overs && Object.keys(innings[0].overs).length) || (innings?.[1]?.overs && Object.keys(innings[1].overs).length)),
    [innings]
  );

  const jumpOver = async (overIndex: number) => {
    await initReplay(slug);
    await seekToOver(slug, overIndex);
    setCurrentReplayIndex(overIndex * 6);
  };

  const jumpNextWicket = async () => {
    await initReplay(slug);
    await seekNextWicket(slug, currentReplayIndex);
  };

  const jumpNextSix = async () => {
    await initReplay(slug);
    await seekNextSix(slug, currentReplayIndex);
  };

  return (
      <div className="space-y-3">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-sky-300/80">Replay Navigation</p>
            <p className="text-xs text-white/60">Jump to over, wicket, or boundary milestones.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={jumpNextWicket}
              disabled={!hasOvers}
              className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-100 disabled:opacity-40"
            >
              Next Wicket
            </button>
            <button
              type="button"
              onClick={jumpNextSix}
              disabled={!hasOvers}
              className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100 disabled:opacity-40"
            >
              Next Six
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        <InningsRow innings={innings?.[0]} title="1st Innings" onJumpOver={jumpOver} />
        <InningsRow innings={innings?.[1]} title="2nd Innings" onJumpOver={jumpOver} />
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
        {[
          ["•", "Dot"],
          ["4", "Boundary"],
          ["6", "Six"],
          ["W", "Wicket"],
          ["Wd/Nb", "Extras"],
        ].map(([token, label]) => (
          <span
            key={token}
            className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1"
          >
            {token} · {label}
          </span>
        ))}
      </div>
    </div>
  );
}
