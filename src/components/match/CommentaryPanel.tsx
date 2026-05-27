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

type BatterArrival = {
  name: string;
  runs: number;
  balls: number;
  strikeRate: string;
  matchup: string;
  pressure: string;
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
  pressure: string;
  momentum: string;
};

type OverBlock = {
  balls: CommentaryBall[];
  contextNotes: string[];
  summary: OverSummary;
  arrivals: BatterArrival[];
  highlightNotes: { type: "WICKET" | "MILESTONE" | "PARTNERSHIP"; message: string }[];
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
      `${ball.bowler} gets the breakthrough. ${ball.dismissedBatsman ?? ball.batsman} departs and the pressure flips hard.`
    );
  }

  if (ball.extraType === "WD") {
    return (
      core ||
      `${ball.bowler} misses the line and concedes extras. Free release in a tight phase.`
    );
  }

  if (ball.extraType === "NB") {
    return (
      core ||
      `${ball.bowler} oversteps and gifts a run. Immediate momentum leak for the fielding side.`
    );
  }

  if (ball.extraType === "BYE" || ball.extraType === "LB") {
    return (
      core ||
      `Smart running and useful extras. The batting side keeps the board ticking.`
    );
  }

  if ((ball.runs ?? 0) === 0) {
    return (
      core ||
      `${ball.bowler} keeps it tight. Dot ball builds scoreboard pressure.`
    );
  }

  if ((ball.runs ?? 0) === 1) {
    return core || `${ball.batsman} rotates strike and keeps the innings moving.`;
  }

  if ((ball.runs ?? 0) === 2) {
    return core || `Good running between the wickets, they come back for two.`;
  }

  if ((ball.runs ?? 0) === 3) {
    return core || `Excellent intent in the running, they stretch it to three.`;
  }

  if ((ball.runs ?? 0) === 4) {
    return core || `${ball.batsman} pierces the gap for four. Strong boundary pressure.`;
  }

  if ((ball.runs ?? 0) === 6) {
    return core || `${ball.batsman} clears the rope. That's a momentum swing ball.`;
  }

  return core || `${ball.batsman} keeps the innings moving with positive intent.`;
}

function getPressureLabel(overRuns: number, overWickets: number) {
  if (overWickets >= 2) return "Extreme";
  if (overWickets === 1 || overRuns <= 3) return "High";
  if (overRuns >= 12) return "Low";
  return "Medium";
}

function getMomentumLabel(overRuns: number, overWickets: number) {
  if (overWickets >= 1 && overRuns <= 5) return "Bowling surge";
  if (overRuns >= 10) return "Batting surge";
  return "Balanced";
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
    const arrivals: BatterArrival[] = [];
    const highlightNotes: {
      type: "WICKET" | "MILESTONE" | "PARTNERSHIP";
      message: string;
    }[] = [];

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

      const preRuns = batter.runs;
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
        highlightNotes.push({
          type: "WICKET",
          message: `${ball.dismissedBatsman ?? ball.batsman} falls at ${score}-${wickets}.`,
        });
      }

      if (preRuns < 50 && batter.runs >= 50) {
        highlightNotes.push({
          type: "MILESTONE",
          message: `${ball.batsman} reaches a fifty (${batter.runs} off ${batter.balls}).`,
        });
      }
      if (preRuns < 100 && batter.runs >= 100) {
        highlightNotes.push({
          type: "MILESTONE",
          message: `${ball.batsman} brings up a hundred in style.`,
        });
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

    if (overRuns >= 14 && overWickets === 0) {
      highlightNotes.push({
        type: "PARTNERSHIP",
        message: "Fast-scoring over builds partnership pressure on the bowling side.",
      });
    }

    const firstDelivery = deliveries[0];
    const lastDelivery = deliveries[deliveries.length - 1];

    const maybeAddArrival = (name?: string, fallbackMatchup?: string) => {
      if (!name || seenBatters.has(name)) return;
      seenBatters.add(name);
      const batter = batterStats[name] ?? { name, runs: 0, balls: 0 };
      const strikeRate = batter.balls > 0 ? ((batter.runs / batter.balls) * 100).toFixed(1) : "0.0";
      arrivals.push({
        name,
        runs: batter.runs,
        balls: batter.balls,
        strikeRate,
        matchup: fallbackMatchup ?? "New matchup in play",
        pressure: getPressureLabel(overRuns, overWickets),
      });
    };

    maybeAddArrival(firstDelivery?.batsman, lastDelivery ? `${lastDelivery.bowler} vs ${firstDelivery?.batsman}` : undefined);
    maybeAddArrival(firstDelivery?.nonStriker, lastDelivery ? `${lastDelivery.bowler} vs ${firstDelivery?.nonStriker}` : undefined);

    if (arrivals.length) {
      contextNotes.push(...arrivals.map((a) => `Batter arrival: ${a.name}`));
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
      balls,
      contextNotes,
      arrivals,
      highlightNotes,
      summary: {
        batters: finalBatters,
        bowler: lastDelivery ? bowlerStats[lastDelivery.bowler] ?? null : null,
        key: `summary-${overNumber}`,
        overLabel: `Over ${overNumber + 1}`,
        overRuns,
        overScore: `${score}-${wickets}`,
        sequence: deliveries.map(getOutcomeToken),
        wicketCount: overWickets,
        pressure: getPressureLabel(overRuns, overWickets),
        momentum: getMomentumLabel(overRuns, overWickets),
      },
    });
  });

  return blocks.reverse();
}

function getTagClasses(tag: string | null) {
  if (tag === "WICKET") return "border-[var(--danger)] bg-red-950/30 text-red-100";
  if (tag === "SIX") return "border-amber-400/35 bg-amber-950/25 text-amber-100";
  if (tag === "FOUR") return "border-sky-400/35 bg-sky-950/25 text-sky-100";
  return "border-[var(--border)] bg-slate-950/55 text-[var(--text-1)]";
}

export default function CommentaryPanel({ matchId, insights }: Props) {
  const innings = useCurrentInnings(matchId);
  const [lang, setLang] = useState<"EN" | "HI">("EN");

  const overBlocks = useMemo(() => buildOverBlocks(innings), [innings]);
  const currentOver = overBlocks[0];

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
      {insights && insights.length > 0 ? (
        <div className="mb-3 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-300">
            Match insights
          </div>
          <div className="space-y-1 text-xs text-yellow-100/85">
            {insights.slice(0, 2).map((insight, index) => (
              <div key={`${insight.type}-${index}`}>{insight.message}</div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-1)]">Live Commentary</h3>
          <p className="text-xs text-[var(--text-3)]">Grouped by over with pressure and milestone context.</p>
        </div>

        <button
          onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
          className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-2)] transition hover:bg-[var(--surface)] hover:text-[var(--text-1)]"
        >
          {lang === "EN" ? "हिंदी" : "English"}
        </button>
      </div>

      {currentOver ? (
        <div className="sticky top-2 z-10 mb-3 rounded-xl border border-cyan-400/25 bg-cyan-500/10 p-2.5 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">Current over strip</span>
            <span className="text-xs text-cyan-100/85">{currentOver.summary.overLabel} · {currentOver.summary.overScore}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {currentOver.summary.sequence.map((token, index) => (
              <span
                key={`${currentOver.summary.key}-strip-${index}`}
                className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border px-1.5 text-[11px] font-semibold ${token === "W" ? "border-[var(--danger)] bg-[var(--danger-light)] text-[var(--danger)]" : "border-[var(--border-med)] bg-[var(--surface)] text-[var(--text-2)]"}`}
              >
                {token}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="max-h-[74vh] space-y-3 overflow-y-auto pr-1">
        {overBlocks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-5 text-sm text-[var(--text-3)]">
            Waiting for live commentary...
          </div>
        ) : null}

        {overBlocks.map((block) => (
          <div key={block.summary.key} className="space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-1)]">{block.summary.overLabel}</span>
                    <span className="text-xs text-[var(--text-3)]">{block.summary.overScore}</span>
                  </div>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-3)]">Over summary</p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="font-mono text-xs text-sky-200">{block.summary.sequence.join("  ")}</div>
                  <div className="mt-1 text-xs text-[var(--text-3)]">
                    {block.summary.overRuns} run{block.summary.overRuns === 1 ? "" : "s"}
                    {block.summary.wicketCount > 0
                      ? ` · ${block.summary.wicketCount} wicket${block.summary.wicketCount > 1 ? "s" : ""}`
                      : ""}
                  </div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.14em] text-[var(--text-3)]">
                    Pressure {block.summary.pressure} · {block.summary.momentum}
                  </div>
                </div>
              </div>

              {block.arrivals.length > 0 ? (
                <div className="mt-3 grid gap-2 border-t border-dashed border-[var(--border)] pt-3 md:grid-cols-2">
                  {block.arrivals.map((arrival) => (
                    <div key={`${block.summary.key}-arrival-${arrival.name}`} className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2">
                      <div className="text-[11px] uppercase tracking-[0.16em] text-cyan-200">Batter arrival</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--text-1)]">{arrival.name}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-cyan-100/85">
                        <span>{arrival.runs}({arrival.balls})</span>
                        <span>SR {arrival.strikeRate}</span>
                        <span>{arrival.pressure} pressure</span>
                      </div>
                      <div className="mt-1 text-xs text-cyan-100/75">{arrival.matchup}</div>
                    </div>
                  ))}
                </div>
              ) : null}

              {block.highlightNotes.length > 0 ? (
                <div className="mt-3 space-y-1.5 border-t border-dashed border-[var(--border)] pt-3">
                  {block.highlightNotes.map((note, index) => (
                    <div
                      key={`${block.summary.key}-highlight-${index}`}
                      className={`rounded-lg border px-3 py-2 text-xs ${
                        note.type === "WICKET"
                          ? "border-red-400/40 bg-red-500/12 text-red-100"
                          : note.type === "MILESTONE"
                            ? "border-amber-400/40 bg-amber-500/12 text-amber-100"
                            : "border-emerald-400/30 bg-emerald-500/12 text-emerald-100"
                      }`}
                    >
                      {note.message}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 grid gap-3 border-t border-[var(--border)] pt-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-1.5 text-xs text-[var(--text-2)]">
                  {block.summary.batters.map((batter) => (
                    <div key={batter.name} className="flex items-center justify-between gap-3">
                      <span>{batter.name}</span>
                      <span className="font-medium text-[var(--text-1)]">
                        {batter.runs}({batter.balls})
                      </span>
                    </div>
                  ))}
                </div>

                {block.summary.bowler ? (
                  <div className="min-w-[130px] text-left md:text-right">
                    <div className="text-xs text-[var(--text-1)]">{block.summary.bowler.name}</div>
                    <div className="mt-1 text-xs text-[var(--text-3)]">
                      {formatOverCount(block.summary.bowler.balls)}-{block.summary.bowler.runs}-{block.summary.bowler.wickets}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              {block.balls.map((ball) => (
                <div key={ball.key} className={`rounded-xl border p-2.5 ${getTagClasses(ball.tag)}`}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium text-[var(--text-1)]">
                        {ball.ballLabel} &nbsp; {translateCommentary(ball.headline, lang)}
                      </div>
                      <p className="mt-1.5 max-w-3xl text-xs leading-5 text-[var(--text-2)]">
                        {translateCommentary(ball.detail, lang)}
                      </p>
                    </div>

                    {ball.tag ? (
                      <span className="rounded-full border border-[var(--border-med)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--text-2)]">
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
