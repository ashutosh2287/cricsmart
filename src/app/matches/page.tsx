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
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Matches</h1>

      <div className="flex gap-3 mb-6">
        {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full ${
              activeTab === tab ? "bg-purple-600" : "bg-gray-800"
            }`}
          >
            {tab === "LIVE" ? "LIVE 🔴" : tab}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400">Loading matches...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.length === 0 ? (
            <p className="text-gray-500">No matches available</p>
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
  );
}

type MatchCardProps = {
  match: Match;
  onClick: () => void;
};

function MatchCard({ match, onClick }: MatchCardProps) {
  const isLive = match.status === "LIVE";

  return (
    <div onClick={onClick} className="bg-gray-900 p-4 rounded-xl cursor-pointer">
      <h2>
        {match.teamA} vs {match.teamB}
      </h2>

      {isLive && (
        <>
          <p>{match.score ?? "0/0"} ({match.overDisplay ?? "0.0"})</p>
          <p className="text-xs text-gray-400 mt-1">
            Connection: {match.reconnectHealth ?? "unknown"}
            {match.heartbeatFresh ? " • fresh" : " • waiting"}
          </p>
        </>
      )}

      {match.commentaryPreview ? (
        <p className="text-xs text-gray-400 mt-2 italic truncate">
          {match.commentaryPreview}
        </p>
      ) : null}

      <button className="mt-3 bg-purple-600 px-3 py-1 rounded">Open Match</button>
    </div>
  );
}
