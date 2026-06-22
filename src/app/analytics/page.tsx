"use client";

import { useEffect, useState } from "react";
import PageMotion from "@/components/ui/PageMotion";
import WinProbabilityChart from "@/components/analytics/WinProbabilityChart";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import MatchPhaseTimeline from "@/components/MatchPhaseTimeline";
import TopPerformersPanel from "@/components/analytics/TopPerformersPanel";
import ImpactLeaderboard from "@/components/analytics/ImpactLeaderboard";
import MatchNarrativePanel from "@/components/analytics/MatchNarrativePanel";
import LiveScoreCard from "@/components/LiveScoreCard";
import TeamList from "@/components/teams/TeamList";
import { Skeleton } from "@/components/ui/Skeleton";

interface MatchRecord {
  matchId: string;
  title?: string;
  teamA?: string;
  teamB?: string;
  status?: string;
}

export default function AnalyticsPage() {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data: MatchRecord[]) => {
        setMatches(data);
        if (data.length > 0) {
          setSelectedMatchId(data[0].matchId);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageMotion>
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Match Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-2)]">
            Real-time cricket intelligence dashboard
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-[var(--text-3)] uppercase tracking-wide">
            Select Match
          </label>
          {loading ? (
            <Skeleton variant="rect" className="h-10 w-full max-w-sm" />
          ) : (
            <select
              value={selectedMatchId}
              onChange={(e) => setSelectedMatchId(e.target.value)}
              className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                color: "var(--text-1)",
              }}
            >
              {matches.map((m) => (
                <option key={m.matchId} value={m.matchId}>
                  {m.title || m.matchId}
                  {m.teamA && m.teamB ? ` — ${m.teamA} vs ${m.teamB}` : ""}
                </option>
              ))}
            </select>
          )}
          {!loading && matches.length === 0 && (
            <p className="text-sm text-[var(--text-3)]">No matches available.</p>
          )}
        </div>

        {!selectedMatchId ? (
          <div className="space-y-8">
            <Skeleton variant="card" />
            <Skeleton variant="chart" />
            <div className="grid lg:grid-cols-3 gap-8">
              <Skeleton variant="card" />
              <Skeleton variant="card" />
              <Skeleton variant="card" />
            </div>
          </div>
        ) : (
          <>
            <div
              className="p-5 shadow-lg transition"
              style={{
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <WinProbabilityChart data={[]} />
            </div>

            <div
              className="p-6 shadow-lg transition"
              style={{
                background: "var(--surface)",
                border: "0.5px solid var(--border)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <h2 className="mb-4 text-sm font-semibold uppercase text-[var(--text-3)]">
                Match Phases
              </h2>

              <MatchPhaseTimeline matchId={selectedMatchId} />

              <div className="grid lg:grid-cols-3 gap-8 mt-6">
                <LiveScoreCard matchId={selectedMatchId} />
                <TopPerformersPanel matchId={selectedMatchId} />
                <ImpactLeaderboard matchId={selectedMatchId} />
                <MatchNarrativePanel matchId={selectedMatchId} />
                <TeamList />
              </div>
            </div>
          </>
        )}
      </main>
    </PageMotion>
  );
}
