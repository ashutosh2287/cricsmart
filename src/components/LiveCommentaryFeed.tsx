"use client";

import { memo, useMemo, useState } from "react";
import { useCommentary, type CommentaryFeedEvent } from "@/hooks/useCommentary";

type FeedFilter = "all" | "wickets" | "boundaries" | "insights" | "milestones" | "summaries";

function matchFilter(commentary: CommentaryFeedEvent, filter: FeedFilter) {
  if (filter === "all") return true;

  if (filter === "wickets") return Boolean(commentary.isWicket);
  if (filter === "boundaries") return /\bFOUR\b|\bSIX\b|boundary|maxim/i.test(commentary.text);
  if (filter === "insights") return commentary.importance === "high";
  if (filter === "milestones") return /\bmilestone\b|\bfifty\b|\bcentury\b|\bpartnership\b/i.test(commentary.text);
  if (filter === "summaries") return commentary.importance === "medium";

  return true;
}

function LiveCommentaryFeed({ matchId }: { matchId: string }) {
  const comments = useCommentary(matchId);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const filtered = useMemo(
    () => comments.filter((item) => matchFilter(item, filter)),
    [comments, filter]
  );

  return (
    <div className="space-y-3 rounded-lg border border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--text-1)]">Live Commentary Intelligence</h3>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as FeedFilter)}
          className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs text-[var(--text-1)]"
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
        {filtered.length === 0 && <p className="text-sm text-[var(--text-3)]">Waiting for commentary...</p>}

        {filtered.map((c, i) => (
          <div
            key={`${c.commentaryId}-${i}`}
            className="text-sm"
            style={{
              background: "var(--surface-2)",
              borderRadius: "var(--radius-md)",
              padding: "10px 12px",
              borderLeft: "2px solid var(--brand)",
            }}
          >
            <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.12em] text-[var(--text-3)]">
              <span>{c.tone ?? "neutral"}</span>
              <span style={{ color: "var(--brand)", fontWeight: 600, fontSize: 12 }}>
                over {c.over}.{c.ball}
                {c.isWicket ? " · wicket" : ""}
              </span>
            </div>
            <p className="mt-1 text-sm leading-5" style={{ color: "var(--text-1)" }}>
              {c.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const MemoizedLiveCommentaryFeed = memo(LiveCommentaryFeed);

MemoizedLiveCommentaryFeed.displayName = "LiveCommentaryFeed";

export default MemoizedLiveCommentaryFeed;
