"use client";

import { useMatchSelector } from "@/services/matchSelectors";
import type { BallEvent } from "@/types/ballEvent";

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

function InningsRow({
  innings,
  title,
}: {
  innings?: InningsSlice;
  title: string;
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

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max snap-x snap-mandatory gap-2.5">
          {overs.map((overNumber) => {
            const balls = innings?.overs?.[overNumber] ?? [];
            const tokens = balls.map(getOutcome);
            const runs = balls.reduce(
              (sum, ball) => sum + (ball.totalRuns ?? ball.runs ?? 0),
              0
            );

            return (
              <div
                key={`${title}-${overNumber}`}
                className="w-[152px] shrink-0 snap-start rounded-xl border border-white/10 bg-white/[0.03] p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">
                    Over {overNumber + 1}
                  </span>
                  <span className="text-xs text-white/55">{runs} runs</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
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
              </div>
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

  return (
    <div className="space-y-4">
      <InningsRow innings={innings?.[0]} title="1st Innings" />
      <InningsRow innings={innings?.[1]} title="2nd Innings" />

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
