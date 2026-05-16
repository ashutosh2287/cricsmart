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

const mockWinData = [
  { over: 1, batting: 52, bowling: 48 },
  { over: 4, batting: 47, bowling: 53, marker: "WICKET" as const },
  { over: 8, batting: 58, bowling: 42, marker: "FOUR" as const },
  { over: 12, batting: 66, bowling: 34, marker: "TURNING_POINT" as const },
  { over: 16, batting: 61, bowling: 39, marker: "WICKET" as const },
  { over: 20, batting: 68, bowling: 32, marker: "SIX" as const, confidence: 0.82 },
];

const mockMomentum = [
  { over: 1, score: 0.2 },
  { over: 3, score: -0.5 },
  { over: 7, score: 1.4 },
  { over: 11, score: 2.1 },
  { over: 15, score: 1.2 },
  { over: 19, score: 2.8 },
];

export default function AnalyticsPage() {
  const matchId = "ind-vs-aus";

  return (
    <PageMotion>
      <main className="mx-auto grid w-full max-w-[1100px] gap-4 px-3 py-5 md:px-4 md:py-6">
        <section className="hierarchy-primary rounded-2xl bg-[var(--bg-surface)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Match Analytics Console</h1>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                Realtime intelligence · momentum · pressure
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-emerald-200">Batting edge +18%</span>
              <span className="rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-amber-200">Pressure medium</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="hierarchy-primary rounded-2xl bg-[var(--bg-surface)] p-3">
            <WinProbabilityChart data={mockWinData} team1="IND" team2="AUS" />
          </div>
          <div className="hierarchy-secondary rounded-2xl bg-[var(--bg-surface)] p-3">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
              Momentum Heatmap
            </h2>
            <MomentumHeatmap data={mockMomentum} />
          </div>
        </section>

        <section className="hierarchy-secondary rounded-2xl bg-[var(--bg-surface)] p-3.5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
            Match Phases
          </h2>
          <MatchPhaseTimeline matchId={matchId} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="hierarchy-secondary rounded-2xl bg-[var(--bg-surface)] p-3">
            <LiveScoreCard matchId={matchId} />
          </div>
          <div className="hierarchy-secondary rounded-2xl bg-[var(--bg-surface)] p-3">
            <TopPerformersPanel matchId={matchId} />
          </div>
          <div className="hierarchy-tertiary rounded-2xl bg-[var(--bg-surface)] p-3">
            <ImpactLeaderboard matchId={matchId} />
          </div>
          <div className="hierarchy-tertiary rounded-2xl bg-[var(--bg-surface)] p-3">
            <MatchNarrativePanel matchId={matchId} />
          </div>
        </section>

        <section className="hierarchy-tertiary rounded-2xl bg-[var(--bg-surface)] p-3">
          <TeamList />
        </section>
      </main>
    </PageMotion>
  );
}
