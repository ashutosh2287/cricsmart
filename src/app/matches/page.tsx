"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";
type MatchType = "SIMULATION" | "LIVE";
type TabType = "ALL" | MatchStatus;

type Match = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  type: MatchType;
  externalMatchId?: string;
  score?: string;
  overDisplay?: string;
  commentaryPreview?: string;
  heartbeatFresh?: boolean;
  reconnectHealth?: "healthy" | "stale" | "disconnected";
};

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const loadMatches = async () => {
      try {
        const res = await fetch("/api/matches", { cache: "no-store" });
        const data = (await res.json()) as Match[];
        if (!cancelled) {
          setMatches(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("❌ Failed to fetch matches", error);
        if (!cancelled) {
          setMatches([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMatches();
    const timer = setInterval(loadMatches, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const filteredMatches = useMemo(() => {
    return activeTab === "ALL"
      ? matches
      : matches.filter((match) => match.status === activeTab);
  }, [activeTab, matches]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 text-white md:px-6">
      <div className="ui-section">
      <div className="ui-section-header">
        <h1 className="text-xl font-bold">Matches</h1>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold tracking-[0.1em] ${
              activeTab === tab
                ? "border-sky-300/40 bg-sky-300 text-slate-950"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]"
            }`}
          >
            {tab === "LIVE" ? "LIVE 🔴" : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading matches...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.length === 0 ? (
            <p className="text-sm text-white/45">No matches available</p>
          ) : (
            filteredMatches.map((match) => (
              <MatchCard
                key={match.matchId}
                match={match}
                onClick={async () => {
                  await fetch("/api/match/init", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      matchId: match.matchId,
                      teamA: match.teamA,
                      teamB: match.teamB,
                      type: match.type,
                      externalMatchId: match.externalMatchId ?? match.matchId,
                    }),
                  });

                  router.push(`/match/${match.matchId}`);
                }}
              />
            ))
          )}
        </div>
      )}
      </div>
    </div>
  );
}

type MatchCardProps = {
  match: Match;
  onClick: () => void;
};

function MatchCard({ match, onClick }: MatchCardProps) {
  const isLive = match.status === "LIVE";

  return (
    <div onClick={onClick} className="ui-rail cursor-pointer transition hover:border-white/20">
      <div className="flex items-start justify-between gap-2">
        <h2 className="truncate text-sm font-semibold">
          {match.teamA} vs {match.teamB}
        </h2>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${
            match.status === "LIVE"
              ? "bg-red-500/15 text-red-300"
              : match.status === "UPCOMING"
              ? "bg-sky-500/15 text-sky-300"
              : "bg-zinc-700/30 text-zinc-300"
          }`}
        >
          {match.status}
        </span>
      </div>

      {isLive && (
        <>
          <p className="mt-1 text-sm tabular-nums">{match.score ?? "0/0"} ({match.overDisplay ?? "0.0"})</p>
          <p className="mt-1 text-xs text-white/50">
            Connection: {match.reconnectHealth ?? "unknown"}
            {match.heartbeatFresh ? " • fresh" : " • waiting"}
          </p>
        </>
      )}

      {match.commentaryPreview ? (
        <p className="mt-2 truncate text-xs italic text-white/55">
          {match.commentaryPreview}
        </p>
      ) : null}

      <button className="mt-3 rounded-md bg-sky-400 px-3 py-1 text-xs font-semibold text-slate-950">
        Open Match
      </button>
    </div>
  );
}
