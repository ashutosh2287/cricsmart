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

        <p className="text-gray-400 text-sm">
          Player performance insights
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {players.map(([name, playerStats]) => {

            const impact = getPlayerImpact(matchId, name);

            return (

              <div
                key={name}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
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

                  <div className="text-blue-400 font-medium mt-2">
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