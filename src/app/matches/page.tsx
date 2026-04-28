"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/* TYPES */

type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";
type MatchType = "SIMULATION" | "LIVE";
type TabType = "ALL" | MatchStatus;

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  type: MatchType;
  score?: string;
  over?: string;
  startTime?: string;
  result?: string;
}

/* PAGE */

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");

  const [matches] = useState<Match[]>([
    {
      id: "1",
      teamA: "India",
      teamB: "Australia",
      status: "LIVE",
      type: "LIVE", // 🔥 REAL MATCH
      score: "120/3",
      over: "15.2",
    },
    {
      id: "2",
      teamA: "England",
      teamB: "Pakistan",
      status: "UPCOMING",
      type: "SIMULATION", // 🔥 SIMULATED MATCH
      startTime: "7:30 PM",
    },
    {
      id: "3",
      teamA: "South Africa",
      teamB: "New Zealand",
      status: "COMPLETED",
      type: "SIMULATION",
      result: "SA won by 5 wickets",
    },
  ]);

  const router = useRouter();

  const filteredMatches =
    activeTab === "ALL"
      ? matches
      : matches.filter((m) => m.status === activeTab);

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Matches</h1>

      <div className="flex gap-3 mb-6">
        {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as TabType[]).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full ${
                activeTab === tab
                  ? "bg-purple-600"
                  : "bg-gray-800"
              }`}
            >
              {tab === "LIVE" ? "LIVE 🔴" : tab}
            </button>
          )
        )}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMatches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onClick={async () => {
              await fetch("/api/match/init", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  matchId: match.id,
                  teamA: match.teamA,
                  teamB: match.teamB,
                  type: match.type, // 🔥 IMPORTANT
                }),
              });

              router.push(`/match/${match.id}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* CARD */

interface MatchCardProps {
  match: Match;
  onClick: () => void;
}

function MatchCard({ match, onClick }: MatchCardProps) {
  return (
    <div onClick={onClick} className="bg-gray-900 p-4 rounded-xl">
      <h2>{match.teamA} vs {match.teamB}</h2>

      {match.status === "LIVE" && (
        <p>{match.score} ({match.over})</p>
      )}

      <button className="mt-3 bg-purple-600 px-3 py-1 rounded">
        Open Match
      </button>
    </div>
  );
}