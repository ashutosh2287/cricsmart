"use client";

import PageMotion from "@/components/ui/PageMotion";
import WinProbabilityChart from "@/components/analytics/WinProbabilityChart";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import MatchPhaseTimeline from "@/components/MatchPhaseTimeline";
import TopPerformersPanel from "@/components/analytics/TopPerformersPanel";
import ImpactLeaderboard from "@/components/analytics/ImpactLeaderboard";
import MatchNarrativePanel from "@/components/analytics/MatchNarrativePanel";
import LiveScoreCard from "@/components/LiveScoreCard";
import TeamList from "@/components/teams/TeamList";


export default function AnalyticsPage() {

  const matchId = "ind-vs-aus";

  return (

    <PageMotion>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        <div>
          <h1 className="text-3xl font-bold">
            Match Analytics
          </h1>

          <p className="mt-1 text-sm text-[var(--text-2)]">
            Real-time cricket intelligence dashboard
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

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
            className="p-5 shadow-lg transition"
            style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <WinProbabilityChart data={[]} />
          </div>

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

          <MatchPhaseTimeline matchId={matchId} />

          <div className="grid lg:grid-cols-3 gap-8">
            <LiveScoreCard matchId={matchId} />
            

  <TopPerformersPanel matchId={matchId} />

  <ImpactLeaderboard matchId={matchId} />

  <MatchNarrativePanel matchId={matchId} />

  
  <TeamList />

</div>

        </div>

      </main>

    </PageMotion>

  );
}
