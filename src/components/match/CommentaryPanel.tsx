"use client";

import { useEffect, useRef, useState } from "react";
import { translateCommentary } from "@/services/commentary/commentaryTranslator";

type BroadcastInsight = {
  type: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
};

type BallEntry = {
  id: string;
  text: string;
  index: number;
  isNew?: boolean;
};

type Props = {
  matchId: string;
  insights?: BroadcastInsight[];
};

// ── Classify ball outcome from commentary text ──────────────
function classifyBall(text: string): "six" | "four" | "wicket" | "dot" | "normal" {
  const t = text.toUpperCase();
  if (t.includes("SIX") || t.includes("MAXIMUM"))                    return "six";
  if (t.includes("FOUR") || t.includes("BOUNDARY") || t.includes("RACES AWAY") || t.includes("CRACKING")) return "four";
  if (t.includes("OUT") || t.includes("WICKET") || t.includes("DISMISSAL") || t.includes("BOWLED") || t.includes("CAUGHT") || t.includes("LBW")) return "wicket";
  if (t.includes("DOT") || t.includes("NO RUN") || t.includes("TIGHT") || t.includes("DEFENDED") || t.includes("MISSES")) return "dot";
  return "normal";
}

// Dot color per outcome
const dotStyles: Record<string, { bg: string; label: string; textColor: string }> = {
  six:     { bg: "var(--accent-amber)",  label: "6",  textColor: "#000" },
  four:    { bg: "var(--accent-brand)",  label: "4",  textColor: "#fff" },
  wicket:  { bg: "var(--accent-danger)", label: "W",  textColor: "#fff" },
  dot:     { bg: "var(--text-muted)",    label: "•",  textColor: "#fff" },
  normal:  { bg: "#22c55e22",            label: "•",  textColor: "var(--accent-live)" },
};

// Is this a milestone entry (gets highlighted row)
function isMilestone(text: string): boolean {
  const t = text.toUpperCase();
  return (
    t.includes("WICKET") || t.includes("OUT") ||
    t.includes("FIFTY") || t.includes("HUNDRED") ||
    t.includes("SIX") || t.includes("MAXIMUM") ||
    t.includes("OVER COMPLETE") || t.includes("INNINGS")
  );
}

export default function CommentaryPanel({ matchId, insights }: Props) {
  const [entries, setEntries] = useState<BallEntry[]>([]);
  const [lang, setLang] = useState<"EN" | "HI">("EN");
  const [newestId, setNewestId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevLengthRef = useRef(0);

  // ── SSE listener ──────────────────────────────────────────
  useEffect(() => {
    function handleUpdate(e: Event) {
      const event = e as CustomEvent;
      const data = event.detail;

      if (!data || data.matchId !== matchId) return;
      if (data.type !== "BALL_EVENT") return;

      if (Array.isArray(data.commentary) && data.commentary.length > 0) {
        const incoming: BallEntry[] = data.commentary.map(
          (text: string, index: number) => ({
            id: `${index}-${text.slice(0, 12)}`,
            text,
            index,
          })
        );

        setEntries((prev) => {
          // Only mark new if we have more entries than before
          if (incoming.length > prevLengthRef.current) {
            const newest = incoming[incoming.length - 1];
            setNewestId(newest.id);
            setTimeout(() => setNewestId(null), 1200);
          }
          prevLengthRef.current = incoming.length;
          return incoming;
        });
      }
    }

    window.addEventListener("CRIC_UPDATE", handleUpdate);
    return () => window.removeEventListener("CRIC_UPDATE", handleUpdate);
  }, [matchId]);

  // ── Auto-scroll to newest ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || entries.length === 0) return;
    containerRef.current.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [entries.length]);

  // Show newest first
  const reversed = [...entries].reverse();

  return (
    <div className="flex flex-col gap-0">

      {/* ── Header row ──────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-0 pb-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2">
          {entries.length > 0 && (
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
          )}
          <span
            className="text-[11px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: "var(--text-secondary)" }}
          >
            Ball by Ball
          </span>
          {entries.length > 0 && (
            <span
              className="text-[11px] tabular-nums"
              style={{ color: "var(--text-muted)" }}
            >
              {entries.length} balls
            </span>
          )}
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
          className="text-[11px] px-2.5 py-1 rounded transition-colors"
          style={{
            background: "var(--bg-overlay)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {lang === "EN" ? "हिंदी" : "English"}
        </button>
      </div>

      {/* ── Insights strip (compact) ────────────────────────── */}
      {insights && insights.length > 0 && (
        <div
          className="flex flex-wrap gap-2 py-2.5"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          {insights.slice(0, 3).map((insight, i) => (
            <span
              key={i}
              className="text-[11px] px-2.5 py-1 rounded-full"
              style={{
                background:
                  insight.severity === "HIGH"
                    ? "rgba(239,68,68,0.12)"
                    : insight.severity === "MEDIUM"
                    ? "rgba(245,158,11,0.12)"
                    : "rgba(34,197,94,0.10)",
                color:
                  insight.severity === "HIGH"
                    ? "var(--accent-danger)"
                    : insight.severity === "MEDIUM"
                    ? "var(--accent-amber)"
                    : "var(--accent-live)",
                border: `1px solid ${
                  insight.severity === "HIGH"
                    ? "rgba(239,68,68,0.2)"
                    : insight.severity === "MEDIUM"
                    ? "rgba(245,158,11,0.2)"
                    : "rgba(34,197,94,0.2)"
                }`,
              }}
            >
              {insight.message}
            </span>
          ))}
        </div>
      )}

      {/* ── Ticker feed ─────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="overflow-y-auto"
        style={{ maxHeight: "360px" }}
      >
        {reversed.length === 0 ? (
          <div className="py-8 text-center">
            <p
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Waiting for first ball...
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {reversed.map((entry) => {
              const kind = classifyBall(entry.text);
              const dot = dotStyles[kind];
              const milestone = isMilestone(entry.text);
              const isNew = entry.id === newestId;

              // Ball number display
              const ballNum = entry.index + 1;
              const overNum = Math.floor(entry.index / 6) + 1;
              const ballInOver = (entry.index % 6) + 1;

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 px-1 py-3 transition-all duration-300"
                  style={{
                    background: isNew
                      ? "rgba(59,130,246,0.06)"
                      : milestone
                      ? kind === "wicket"
                        ? "rgba(239,68,68,0.04)"
                        : kind === "six"
                        ? "rgba(245,158,11,0.04)"
                        : kind === "four"
                        ? "rgba(59,130,246,0.04)"
                        : "transparent"
                      : "transparent",
                    // Slide-in for newest
                    animation: isNew ? "slideInTop 0.2s ease-out" : undefined,
                  }}
                >
                  {/* Ball number — fixed width */}
                  <div className="shrink-0 pt-0.5">
                    <span
                      className="text-[11px] tabular-nums font-mono"
                      style={{ color: "var(--text-muted)", minWidth: "32px", display: "block" }}
                    >
                      {overNum}.{ballInOver}
                    </span>
                  </div>

                  {/* Outcome dot */}
                  <div className="shrink-0 pt-0.5">
                    <span
                      className="inline-flex items-center justify-center rounded text-[10px] font-bold"
                      style={{
                        width: "20px",
                        height: "20px",
                        background: dot.bg,
                        color: dot.textColor,
                        opacity: kind === "normal" ? 0.8 : 1,
                      }}
                    >
                      {dot.label}
                    </span>
                  </div>

                  {/* Commentary text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: milestone
                          ? "var(--text-primary)"
                          : "var(--text-secondary)",
                        fontWeight: milestone ? 500 : 400,
                      }}
                    >
                      {translateCommentary(entry.text, lang)}
                    </p>
                  </div>

                  {/* Milestone badge */}
                  {milestone && (
                    <div className="shrink-0 pt-0.5">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            kind === "wicket"
                              ? "rgba(239,68,68,0.15)"
                              : kind === "six"
                              ? "rgba(245,158,11,0.15)"
                              : "rgba(59,130,246,0.15)",
                          color:
                            kind === "wicket"
                              ? "var(--accent-danger)"
                              : kind === "six"
                              ? "var(--accent-amber)"
                              : "var(--accent-brand)",
                        }}
                      >
                        {kind === "wicket" ? "OUT" : kind === "six" ? "SIX" : "FOUR"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-in keyframe */}
      <style>{`
        @keyframes slideInTop {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}