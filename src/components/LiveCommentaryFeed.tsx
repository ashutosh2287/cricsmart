"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { subscribeCommentary, type Commentary } from "@/services/commentary/commentaryBus";

type FeedFilter = "all" | "wickets" | "boundaries" | "insights" | "milestones" | "summaries";

function toneClasses(commentary: Commentary) {
  const tone = commentary.metadata?.tone;
  if (commentary.metadata?.futureReadiness.highlightSignals.turningPoint) {
    return "border-amber-400/40 bg-amber-500/10";
  }

  if (tone === "dramatic") return "border-red-400/35 bg-red-500/10";
  if (tone === "aggressive") return "border-orange-400/35 bg-orange-500/10";
  if (tone === "celebratory") return "border-emerald-400/35 bg-emerald-500/10";
  if (tone === "analytical") return "border-sky-400/35 bg-sky-500/10";
  if (tone === "tense") return "border-fuchsia-400/30 bg-fuchsia-500/10";
  return "border-white/10 bg-slate-950/55";
}

function matchFilter(commentary: Commentary, filter: FeedFilter) {
  if (filter === "all") return true;

  const tags = commentary.metadata?.tags ?? [];
  const categories = commentary.metadata?.categories ?? [];

  if (filter === "wickets") return tags.includes("wicket");
  if (filter === "boundaries") return /\bFOUR\b|\bSIX\b|boundary|maxim/i.test(commentary.text);
  if (filter === "insights") return commentary.category === "INSIGHT";
  if (filter === "milestones") return tags.includes("milestone") || categories.includes("milestone");
  if (filter === "summaries") return commentary.category === "SUMMARY" || categories.some((item) => item.startsWith("summary:"));

  return true;
}

function LiveCommentaryFeed() {
  const [comments, setComments] = useState<Commentary[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const mounted = useRef(false);

  const handleCommentary = useCallback((c: Commentary) => {
    if (!mounted.current) return;

    setComments((prev) => {
      const updated = [c, ...prev];
      return updated.slice(0, 80);
    });
  }, []);

  useEffect(() => {
    mounted.current = true;

    const unsub = subscribeCommentary(handleCommentary);

    return () => {
      mounted.current = false;
      unsub();
    };
  }, [handleCommentary]);

  const filtered = useMemo(() => comments.filter((item) => matchFilter(item, filter)), [comments, filter]);

  return (
    <div className="space-y-3 rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-gray-300">Live Commentary Intelligence</h3>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as FeedFilter)}
          className="rounded-md border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
        >
          <option value="all">All</option>
          <option value="wickets">Wickets</option>
          <option value="boundaries">Boundaries</option>
          <option value="insights">AI Insights</option>
          <option value="milestones">Milestones</option>
          <option value="summaries">Summaries</option>
        </select>
      </div>

      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {filtered.length === 0 && <p className="text-sm text-gray-500">Waiting for commentary...</p>}

        {filtered.map((c, i) => (
          <div key={`${c.eventId}-${i}`} className={`rounded-lg border px-3 py-2 text-sm text-white ${toneClasses(c)}`}>
            <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-white/65">
              <span>{c.metadata?.tone ?? "neutral"}</span>
              <span>
                {c.metadata?.strategy.path ?? "template"}
                {c.metadata?.futureReadiness.highlightSignals.turningPoint ? " · turning-point" : ""}
              </span>
            </div>
            <p className="mt-1 text-sm leading-5">{c.text}</p>
            {c.metadata ? (
              <div className="mt-1 text-[11px] text-white/55">
                mode: {c.metadata.runtimeMode} · latency: {Math.round(c.metadata.latencyMs)}ms · cache: {c.metadata.cacheHit ? "hit" : "miss"}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

const MemoizedLiveCommentaryFeed = memo(LiveCommentaryFeed);

MemoizedLiveCommentaryFeed.displayName = "LiveCommentaryFeed";

export default MemoizedLiveCommentaryFeed;
