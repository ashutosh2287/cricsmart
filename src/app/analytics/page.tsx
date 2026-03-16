"use client";

import PageMotion from "@/components/ui/PageMotion";
import WinProbabilityChart from "@/components/analytics/WinProbabilityChart";
import MomentumHeatmap from "@/components/MomentumHeatmap";
import MatchPhaseTimeline from "@/components/MatchPhaseTimeline";
import TopPerformersPanel from "@/components/analytics/TopPerformersPanel";
import ImpactLeaderboard from "@/components/analytics/ImpactLeaderboard";
import MatchNarrativePanel from "@/components/analytics/MatchNarrativePanel";
import LiveScoreCard from "@/components/LiveScoreCard";

export default function AnalyticsPage() {

  const matchId = "ind-vs-aus";

  return (

    <PageMotion>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">

        <div>
          <h1 className="text-3xl font-bold">
            Match Analytics
          </h1>

          <p className="text-gray-400 text-sm mt-1">
            Real-time cricket intelligence dashboard
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg hover:border-blue-500 transition">
            <WinProbabilityChart matchId={matchId} />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-lg hover:border-blue-500 transition">
            <MomentumHeatmap matchId={matchId} />
          </div>

        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg hover:border-blue-500 transition">

          <h2 className="text-sm font-semibold text-gray-400 uppercase mb-4">
            Match Phases
          </h2>

          <MatchPhaseTimeline matchId={matchId} />

          <div className="grid lg:grid-cols-3 gap-8">
            <LiveScoreCard matchId={matchId} />
            

  <TopPerformersPanel matchId={matchId} />

  <ImpactLeaderboard matchId={matchId} />

  <MatchNarrativePanel matchId={matchId} />

</div>

        </div>

      </main>

    </PageMotion>

  );
}