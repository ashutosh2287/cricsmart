"use client";

import PageMotion from "@/components/ui/PageMotion";
import { getPlayerStats } from "@/services/analytics/playerStatsEngine";
import { getPlayerImpact } from "@/services/analytics/playerImpactEngine";

export default function PlayerAnalyticsPage() {

  const matchId = "ind-vs-aus";

  const stats = getPlayerStats(matchId);

  const players = Object.entries(stats);

  return (

    <PageMotion>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        <h1 className="text-3xl font-bold">
          Player Analytics
        </h1>

        <p className="text-sm text-[var(--text-secondary)]">
          Player performance insights
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {players.map(([name, playerStats]) => {

            const impact = getPlayerImpact(matchId, name);

            return (

              <div
                key={name}
                className="rounded-xl p-5"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >

                <h2 className="text-lg font-semibold mb-3">
                  {name}
                </h2>

                <div className="text-sm space-y-1">

                  <div>
                    Runs: {playerStats.batting.runs}
                  </div>

                  <div>
                    Balls: {playerStats.batting.balls}
                  </div>

                  <div>
                    Fours: {playerStats.batting.fours}
                  </div>

                  <div>
                    Sixes: {playerStats.batting.sixes}
                  </div>

                  <div>
                    Wickets: {playerStats.bowling.wickets}
                  </div>

                  <div className="mt-2 font-medium text-[var(--accent-brand)]">
                    Impact Score: {impact.toFixed(1)}
                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </main>

    </PageMotion>

  );
}