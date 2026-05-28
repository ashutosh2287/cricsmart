"use client";

import { getGlobalAnalytics } from "@/services/analytics/globalAnalyticsEngine";
import LeaderboardCards from "@/components/analytics/LeaderboardCards";
import MomentumLeadersChart from "@/components/analytics/MomentumLeadersChart";

export default function GlobalAnalyticsPage() {

  const data = getGlobalAnalytics();

  return (

    <div className="p-6 space-y-6 text-[var(--text-primary)]">

      <h1 className="text-2xl font-bold">
        Global Cricket Analytics
      </h1>

      <h1 className="text-2xl font-bold">
  Global Cricket Analytics
</h1>

<LeaderboardCards />
<MomentumLeadersChart />

      {/* Top Run Scorers */}

      <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)]">

        <h2 className="text-sm uppercase text-[var(--text-secondary)] mb-3">
          Top Run Scorers
        </h2>

        {data.topRunScorers.map((p, i) => (

          <div key={i} className="flex justify-between text-sm mb-1">

            <span>{p.playerId}</span>
            <span>{p.runs}</span>

          </div>

        ))}

      </div>

      {/* Top Impact Players */}

      <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)]">

        <h2 className="text-sm uppercase text-[var(--text-secondary)] mb-3">
          Top Impact Players
        </h2>

        {data.topImpactPlayers.map((p, i) => (

          <div key={i} className="flex justify-between text-sm mb-1">

            <span>{p.playerId}</span>
            <span>{p.impact.toFixed(1)}</span>

          </div>

        ))}

      </div>

    </div>

  );

}