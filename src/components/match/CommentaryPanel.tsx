"use client";

import { useMemo, useState } from "react";
import type { InningsState } from "@/services/matchEngine";
import { useCurrentInnings } from "@/services/matchSelectors";
import { translateCommentary } from "@/services/commentary/commentaryTranslator";
import type { BallEvent } from "@/types/ballEvent";

type BroadcastInsight = {
  type: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

type Props = {
  matchId: string;
  insights?: BroadcastInsight[];
};

type BatterSnapshot = {
  name: string;
  runs: number;
  balls: number;
};

type BowlerSnapshot = {
  name: string;
  balls: number;
  runs: number;
  wickets: number;
};

type CommentaryBall = {
  key: string;
  ballLabel: string;
  detail: string;
  headline: string;
  tag: string | null;
};

type OverSummary = {
  batters: BatterSnapshot[];
  bowler: BowlerSnapshot | null;
  key: string;
  overLabel: string;
  overRuns: number;
  overScore: string;
  sequence: string[];
  wicketCount: number;
};

type OverBlock = {
  balls: CommentaryBall[];
  contextNotes: string[];
  summary: OverSummary;
};

function getBallTotalRuns(ball: BallEvent) {
  return ball.totalRuns ?? ball.runs ?? 0;
}

function getBatterRuns(ball: BallEvent) {
  if (ball.extraType === "WD" || ball.extraType === "BYE" || ball.extraType === "LB") {
    return 0;
  }

  if (ball.extraType === "NB") {
    return Math.max(0, getBallTotalRuns(ball) - (ball.extraRuns ?? 1));
  }

  return ball.runs ?? 0;
}

function getBowlerRuns(ball: BallEvent) {
  if (ball.extraType === "BYE" || ball.extraType === "LB") return 0;
  return getBallTotalRuns(ball);
}

function getOutcomeToken(ball: BallEvent) {
  if (ball.type === "WICKET") return "W";
  if (ball.extraType === "WD") return "Wd";
  if (ball.extraType === "NB") return "Nb";
  if (ball.extraType === "BYE") return `B${ball.runs ?? 0}`;
  if (ball.extraType === "LB") return `Lb${ball.runs ?? 0}`;
  if (ball.runs === 4) return "4";
  if (ball.runs === 6) return "6";
  return String(getBallTotalRuns(ball));
}

function formatOverCount(legalBalls: number) {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

function getShortOutcome(ball: BallEvent) {
  if (ball.type === "WICKET") {
    return `${ball.dismissedBatsman ?? ball.batsman} is out`;
  }

  if (ball.extraType === "WD") {
    return `${getBallTotalRuns(ball)} wide${getBallTotalRuns(ball) > 1 ? "s" : ""}`;
  }

  if (ball.extraType === "NB") {
    return `${getBallTotalRuns(ball)} off a no-ball`;
  }

  if (ball.extraType === "BYE") {
    return `${ball.runs ?? 0} bye${(ball.runs ?? 0) > 1 ? "s" : ""}`;
  }

  if (ball.extraType === "LB") {
    return `${ball.runs ?? 0} leg bye${(ball.runs ?? 0) > 1 ? "s" : ""}`;
  }

  if ((ball.runs ?? 0) === 0) return "no run";
  if ((ball.runs ?? 0) === 1) return "1 run";
  return `${ball.runs ?? 0} runs`;
}

function getBallTag(ball: BallEvent) {
  if (ball.type === "WICKET") return "WICKET";
  if ((ball.runs ?? 0) === 4) return "FOUR";
  if ((ball.runs ?? 0) === 6) return "SIX";
  if (ball.extraType === "WD") return "WIDE";
  if (ball.extraType === "NB") return "NO BALL";
  return null;
}

function buildDetailedCommentary(ball: BallEvent) {
  const core = ball.commentary?.trim();

  if (ball.type === "WICKET") {
    return (
      core ||
      `${ball.bowler} hits the right area and gets the breakthrough. ${ball.dismissedBatsman ?? ball.batsman} has to walk back, and the fielding side suddenly has all the energy.`
    );
  }

  if (ball.extraType === "WD") {
    return (
      core ||
      `${ball.bowler} loses the line and gifts an extra. That is a release ball, and the batting side will happily take the bonus without having to play a shot.`
    );
  }

  if (ball.extraType === "NB") {
    return (
      core ||
      `${ball.bowler} oversteps and hands over a free run. That mistake puts the pressure straight back on the bowling side.`
    );
  }

  if (ball.extraType === "BYE" || ball.extraType === "LB") {
    return (
      core ||
      `Useful extras for the batting side here. Even without coming off the middle, they keep the scoreboard moving and make this over feel productive.`
    );
  }

  if ((ball.runs ?? 0) === 0) {
    return (
      core ||
      `Lovely discipline from ${ball.bowler}. ${ball.batsman} cannot find the gap, so the fielding side builds pressure and forces the batters to rethink the next option.`
    );
  }

  if ((ball.runs ?? 0) === 1) {
    return (
      core ||
      `${ball.batsman} nudges it away and keeps the strike rotating. Nothing dramatic, but it is enough to keep this innings ticking along.`
    );
  }

  if ((ball.runs ?? 0) === 2) {
    return (
      core ||
      `Good running between the wickets. ${ball.batsman} places it well enough to come back for two, and that turns a quiet ball into a positive result.`
    );
  }

  if ((ball.runs ?? 0) === 3) {
    return (
      core ||
      `Excellent awareness from the batting pair. They push hard for the third and make the fielding side work deep into the over.`
    );
  }

  if ((ball.runs ?? 0) === 4) {
    return (
      core ||
      `${ball.batsman} finds the gap with authority. Once it beats the infield, there is no catching it, and that boundary changes the feel of the over immediately.`
    );
  }

  if ((ball.runs ?? 0) === 6) {
    return (
      core ||
      `${ball.batsman} goes big and clears the rope cleanly. That is the kind of strike that lifts the dugout and flips the pressure in one shot.`
    );
  }

  return core || `${ball.batsman} keeps the innings moving with a busy scoring shot.`;
}

function buildOverBlocks(innings: InningsState | undefined): OverBlock[] {
  if (!innings) return [];

  const overKeys = Object.keys(innings.overs ?? {})
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  const batterStats: Record<string, BatterSnapshot> = {};
  const bowlerStats: Record<string, BowlerSnapshot> = {};
  const seenBatters = new Set<string>();
  let currentSpellBowler: string | null = null;
  let currentSpellOvers = 0;
  let score = 0;
  let wickets = 0;

  const blocks: OverBlock[] = [];

  overKeys.forEach((overNumber) => {
    const deliveries = innings.overs[overNumber] ?? [];
    const contextNotes: string[] = [];
    let legalBallNumber = 0;
    let overRuns = 0;
    let overWickets = 0;

    const balls = deliveries.map((ball, index) => {
      const batter = batterStats[ball.batsman] ?? {
        name: ball.batsman,
        runs: 0,
        balls: 0,
      };
      const nonStriker = batterStats[ball.nonStriker] ?? {
        name: ball.nonStriker,
        runs: 0,
        balls: 0,
      };
      const bowler = bowlerStats[ball.bowler] ?? {
        name: ball.bowler,
        balls: 0,
        runs: 0,
        wickets: 0,
      };

      const batterRuns = getBatterRuns(ball);
      const bowlerRuns = getBowlerRuns(ball);
      const totalRuns = getBallTotalRuns(ball);
      const countsAsBall = ball.isLegalDelivery && ball.extraType !== "WD";

      batter.runs += batterRuns;
      if (countsAsBall) batter.balls += 1;

      if (!batterStats[ball.batsman]) batterStats[ball.batsman] = batter;
      if (!batterStats[ball.nonStriker]) batterStats[ball.nonStriker] = nonStriker;

      bowler.runs += bowlerRuns;
      if (ball.isLegalDelivery) bowler.balls += 1;
      if (ball.type === "WICKET") bowler.wickets += 1;
      bowlerStats[ball.bowler] = bowler;

      score += totalRuns;
      overRuns += totalRuns;

      if (ball.type === "WICKET") {
        wickets += 1;
        overWickets += 1;
      }

      if (ball.isLegalDelivery) {
        legalBallNumber += 1;
      }

      return {
        key: `${overNumber}-${index}-${ball.id}`,
        ballLabel: `${overNumber}.${Math.min(Math.max(legalBallNumber, 1), 6)}`,
        headline: `${ball.bowler} to ${ball.batsman}, ${getShortOutcome(ball)}`,
        detail: buildDetailedCommentary(ball),
        tag: getBallTag(ball),
      };
    });

    const lastDelivery = deliveries[deliveries.length - 1];
    const firstDelivery = deliveries[0];
    if (firstDelivery?.batsman && !seenBatters.has(firstDelivery.batsman)) {
      contextNotes.push(`New batter in: ${firstDelivery.batsman} on strike.`);
      seenBatters.add(firstDelivery.batsman);
    }
    if (firstDelivery?.nonStriker && !seenBatters.has(firstDelivery.nonStriker)) {
      contextNotes.push(`New batter in: ${firstDelivery.nonStriker} at non-striker's end.`);
      seenBatters.add(firstDelivery.nonStriker);
    }

    if (lastDelivery?.bowler) {
      if (currentSpellBowler !== lastDelivery.bowler) {
        currentSpellBowler = lastDelivery.bowler;
        currentSpellOvers = 1;
      } else {
        currentSpellOvers += 1;
      }
      contextNotes.push(
        currentSpellOvers === 1
          ? `${lastDelivery.bowler} starts a new spell.`
          : `${lastDelivery.bowler} continues spell (${currentSpellOvers} overs).`
      );
    }

    const finalBatters = lastDelivery
      ? [lastDelivery.batsman, lastDelivery.nonStriker]
          .filter(Boolean)
          .map((name) => batterStats[name])
          .filter(Boolean)
      : [];

    blocks.push({
      contextNotes,
      summary: {
        batters: finalBatters,
        bowler: lastDelivery ? bowlerStats[lastDelivery.bowler] ?? null : null,
        key: `summary-${overNumber}`,
        overLabel: `Over ${overNumber + 1}`,
        overRuns,
        overScore: `${score}-${wickets}`,
        sequence: deliveries.map(getOutcomeToken),
        wicketCount: overWickets,
      },
      balls,
    });
  });

  return blocks.reverse();
}

export default function CommentaryPanel({ matchId, insights }: Props) {
  const innings = useCurrentInnings(matchId);
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  const overBlocks = useMemo(() => buildOverBlocks(innings), [innings]);

  return (
    <div className="rounded-[18px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] p-4">
      {insights && insights.length > 0 ? (
        <div className="mb-4 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-300">
            Match insights
          </div>
          <div className="space-y-2 text-sm text-yellow-100/85">
            {insights.slice(0, 3).map((insight, index) => (
              <div key={`${insight.type}-${index}`}>{insight.message}</div>
            ))}
          </div>
        </div>
      ) : null}

        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Commentary</h3>
          <p className="mt-1 text-sm leading-5 text-white/60">
            Latest over first, with richer ball-by-ball notes and a quick over
            summary after each phase.
          </p>
        </div>

        <button
          onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
          className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
        >
          {lang === "EN" ? "हिंदी" : "English"}
        </button>
      </div>

      <div className="max-h-[78vh] space-y-4 overflow-y-auto pr-1">
        {overBlocks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-sm text-white/55">
            Waiting for live commentary...
          </div>
        ) : null}

        {overBlocks.map((block) => (
          <div key={block.summary.key} className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold text-white">
                      {block.summary.overLabel}
                    </span>
                    <span className="text-sm text-white/55">{block.summary.overScore}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    Over summary
                  </p>
                </div>

                <div className="text-left lg:text-right">
                  <div className="font-mono text-sm text-sky-200">
                    {block.summary.sequence.join("  ")}
                  </div>
                  <div className="mt-1 text-sm text-white/60">
                    {block.summary.overRuns} run{block.summary.overRuns === 1 ? "" : "s"}
                    {block.summary.wicketCount > 0
                      ? ` · ${block.summary.wicketCount} wicket${block.summary.wicketCount > 1 ? "s" : ""}`
                      : ""}
                  </div>
                </div>
              </div>

              {!!block.contextNotes.length && (
                <div className="mt-3 space-y-1 border-t border-dashed border-white/10 pt-3">
                  {block.contextNotes.map((note, index) => (
                    <div
                      key={`${block.summary.key}-note-${index}`}
                      className="text-xs uppercase tracking-[0.14em] text-sky-200/80"
                    >
                      {note}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 grid gap-4 border-t border-white/10 pt-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-2 text-sm text-white/75">
                  {block.summary.batters.map((batter) => (
                    <div key={batter.name} className="flex items-center justify-between gap-3">
                      <span>{batter.name}</span>
                      <span className="font-medium text-white">
                        {batter.runs}({batter.balls})
                      </span>
                    </div>
                  ))}
                </div>

                {block.summary.bowler ? (
                  <div className="min-w-[140px] text-left md:text-right">
                    <div className="text-sm text-white">{block.summary.bowler.name}</div>
                    <div className="mt-1 text-sm text-white/60">
                      {formatOverCount(block.summary.bowler.balls)}-
                      {block.summary.bowler.runs}-{block.summary.bowler.wickets}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-dashed border-white/10 pt-3 text-xs uppercase tracking-[0.18em] text-white/45">
                <span>Over summary card</span>
                <span>Latest phase</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {block.balls.map((ball) => (
                <div
                  key={ball.key}
                  className={`rounded-2xl border p-3.5 ${
                    ball.tag === "WICKET"
                      ? "border-red-400/35 bg-red-950/20"
                      : "border-white/10 bg-slate-950/55"
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {ball.ballLabel} &nbsp; {translateCommentary(ball.headline, lang)}
                      </div>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">
                        {translateCommentary(ball.detail, lang)}
                      </p>
                    </div>

                    {ball.tag ? (
                      <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-sky-200">
                        {ball.tag}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
