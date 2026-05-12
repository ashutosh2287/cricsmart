"use client";

import AnimatedScore from "./ui/AnimatedScore";

type Batsman = {
  name: string;
  runs: number;
  balls: number;
  isStriker?: boolean;
};

type Bowler = {
  name: string;
  overs: number;
  runs: number;
  wickets: number;
};

type Props = {
  team1: string;
  team2: string;
  runs: number;
  wickets: number;
  over: number;
  ball: number;
  striker?: Batsman;
  nonStriker?: Batsman;
  bowler?: Bowler;
  lastOverBalls?: string[];
  isLive?: boolean;
  target?: number;
  runsNeeded?: number;
  ballsLeft?: number;
  rrr?: number;
  crr?: number;
  totalOvers?: number;
  // Match result
  matchEnded?: boolean;
  winner?: string | null;
  winBy?: string | number | null;
};

function getBallChipStyle(ball: string): string {
  if (ball === "W")  return "bg-[#ef4444]/15 text-[#ef4444] font-bold";
  if (ball === "4")  return "bg-[#3b82f6]/15 text-[#3b82f6] font-semibold";
  if (ball === "6")  return "bg-[#f59e0b]/15 text-[#f59e0b] font-bold";
  if (ball === "Wd") return "bg-[#f59e0b]/10 text-[#f59e0b]";
  if (ball === "Nb") return "bg-orange-500/10 text-orange-400";
  if (ball === "0")  return "bg-white/[0.04] text-[var(--text-muted)]";
  return "bg-[#22c55e]/10 text-[#22c55e]";
}

export default function MatchHeader({
  team1,
  team2,
  runs,
  wickets,
  over,
  ball,
  striker,
  nonStriker,
  bowler,
  lastOverBalls = [],
  isLive = true,
  target,
  runsNeeded,
  ballsLeft,
  rrr,
  crr,
  totalOvers = 20,
  matchEnded = false,
  winner,
  winBy,
}: Props) {
  console.log("🏏 MATCH HEADER RENDER");

  const finalTeam1 = team1 || "Team A";
  const finalTeam2 = team2 || "Team B";

  const totalBalls = totalOvers * 6;
  const ballsBowled = over * 6 + ball;
  const progress = Math.min(ballsBowled / totalBalls, 1);

  const showChase =
    !matchEnded &&
    typeof target === "number" &&
    target > 0 &&
    typeof runsNeeded === "number" &&
    typeof ballsLeft === "number";

  return (
    <div
      className="w-full overflow-hidden"
      style={{
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-lg)",
      }}
    >

      {/* ── Winner banner (match ended) ───────────────────── */}
      {matchEnded && winner && (
        <div
          className="relative flex items-center justify-center gap-3 px-5 py-4 overflow-hidden"
          style={{ background: "linear-gradient(135deg, #166534 0%, #14532d 50%, #052e16 100%)" }}
        >
          {/* Background shimmer effect */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: "radial-gradient(ellipse at center, #22c55e 0%, transparent 70%)",
            }}
          />

          {/* Trophy icon */}
          <span className="text-2xl relative z-10">🏆</span>

          <div className="relative z-10 text-center">
            <p
              className="text-xs uppercase tracking-[0.2em] font-medium mb-0.5"
              style={{ color: "#86efac" }}
            >
              Match Result
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: "#ffffff" }}
            >
              {winner} won
            </p>
            {winBy && (
              <p
                className="text-sm font-medium mt-0.5"
                style={{ color: "#bbf7d0" }}
              >
                by {winBy}
              </p>
            )}
          </div>

          {/* Confetti dots */}
          <div className="absolute top-1 left-6 w-1.5 h-1.5 rounded-full bg-yellow-400/60" />
          <div className="absolute top-3 left-16 w-1 h-1 rounded-full bg-green-300/60" />
          <div className="absolute bottom-2 right-12 w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
          <div className="absolute top-2 right-20 w-1 h-1 rounded-full bg-white/40" />
        </div>
      )}

      {/* ── Live / status bar ─────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-0">
        {isLive && !matchEnded && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "var(--accent-live)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "var(--accent-live)" }}
              />
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: "var(--accent-live)" }}
            >
              Live
            </span>
          </span>
        )}

        {matchEnded && (
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--text-muted)" }}
          >
            Full Time
          </span>
        )}

        <span
          className="text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          T20
        </span>

        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          Over {over}.{ball}
        </span>
      </div>

      {/* ── Main hero: teams + score ──────────────────────── */}
      <div className="flex items-end justify-between gap-4 px-5 pt-3 pb-2">

        {/* Both teams — equal visual weight */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xl font-bold md:text-2xl"
              style={{ color: "var(--text-primary)" }}
            >
              {finalTeam1}
            </span>
            <span
              className="text-sm font-medium px-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              vs
            </span>
            <span
              className="text-xl font-bold md:text-2xl"
              style={{ color: "var(--text-primary)" }}
            >
              {finalTeam2}
            </span>
          </div>
          <p
            className="text-xs mt-1"
            style={{ color: "var(--text-muted)" }}
          >
            Live simulation · innings-aware scorecard
          </p>
        </div>

        {/* Score — dominant element */}
        <div className="text-right shrink-0">
          <div
            className="font-extrabold tabular-nums leading-none"
            style={{
              fontSize: "clamp(36px, 7vw, 64px)",
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
            }}
          >
            <AnimatedScore value={`${runs}/${wickets}`} />
          </div>
          <p
            className="text-xs mt-1 tabular-nums"
            style={{ color: "var(--text-secondary)" }}
          >
            {over}.{ball} ov
          </p>
        </div>
      </div>

      {/* ── Over progress bar ─────────────────────────────── */}
      <div className="px-5 pb-1">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "3px", background: "var(--bg-overlay)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progress * 100}%`,
              background: matchEnded ? "var(--text-muted)" : "var(--accent-live)",
              opacity: 0.8,
            }}
          />
        </div>
      </div>

      {/* ── Players row ───────────────────────────────────── */}
      {(striker || nonStriker || bowler) && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 text-sm"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          {striker && (
            <span className="flex items-center gap-1.5">
              <span style={{ color: "var(--accent-amber)" }}>★</span>
              <span
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {striker.name}
              </span>
              <span
                className="tabular-nums text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {striker.runs}({striker.balls})
              </span>
            </span>
          )}

          {nonStriker && (
            <span className="flex items-center gap-1.5">
              <span style={{ color: "var(--text-muted)" }}>○</span>
              <span style={{ color: "var(--text-secondary)" }}>
                {nonStriker.name}
              </span>
              <span
                className="tabular-nums text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {nonStriker.runs}({nonStriker.balls})
              </span>
            </span>
          )}

          {bowler && (
            <span className="flex items-center gap-1.5 ml-auto">
              <span
                className="text-xs"
                style={{ color: "var(--accent-brand)" }}
              >
                🎳
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {bowler.name}
              </span>
              <span
                className="tabular-nums text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {bowler.overs}-{bowler.runs}-{bowler.wickets}
              </span>
            </span>
          )}
        </div>
      )}

      {/* ── Last over balls ───────────────────────────────── */}
      {lastOverBalls.length > 0 && (
        <div
          className="flex items-center gap-1.5 px-5 py-2.5"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <span
            className="text-[11px] uppercase tracking-[0.15em] mr-1 shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            Last over
          </span>
          <div className="flex items-center gap-1 flex-wrap">
            {lastOverBalls.map((b, i) => (
              <span
                key={i}
                className={`inline-flex items-center justify-center rounded text-xs px-2 py-0.5 min-w-[26px] tabular-nums ${getBallChipStyle(b)}`}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Chase info (innings 2) ────────────────────────── */}
      {showChase && (
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-2.5 text-sm"
          style={{ borderTop: "1px solid var(--border-subtle)" }}
        >
          <span>
            <span
              className="text-[11px] uppercase tracking-[0.12em] mr-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Target
            </span>
            <span
              className="font-semibold tabular-nums"
              style={{ color: "var(--text-primary)" }}
            >
              {target}
            </span>
          </span>

          <span>
            <span
              className="text-[11px] uppercase tracking-[0.12em] mr-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Need
            </span>
            <span
              className="font-semibold tabular-nums"
              style={{
                color:
                  (runsNeeded ?? 0) > 12
                    ? "var(--accent-danger)"
                    : "var(--accent-live)",
              }}
            >
              {runsNeeded} off {ballsLeft}
            </span>
          </span>

          {typeof rrr === "number" && rrr > 0 && (
            <span>
              <span
                className="text-[11px] uppercase tracking-[0.12em] mr-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                RRR
              </span>
              <span
                className="font-semibold tabular-nums"
                style={{
                  color:
                    rrr > 12
                      ? "var(--accent-danger)"
                      : "var(--accent-amber)",
                }}
              >
                {rrr.toFixed(2)}
              </span>
            </span>
          )}

          {typeof crr === "number" && crr > 0 && (
            <span className="ml-auto">
              <span
                className="text-[11px] uppercase tracking-[0.12em] mr-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                CRR
              </span>
              <span
                className="tabular-nums"
                style={{ color: "var(--text-secondary)" }}
              >
                {crr.toFixed(2)}
              </span>
            </span>
          )}
        </div>
      )}

    </div>
  );
}