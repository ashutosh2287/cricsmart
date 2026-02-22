"use client";

import { routeAdminCommand } from "@/services/adminCommandRouter";

type Props = {
  matchId: string;
};

export default function AdminScoringPanel({ matchId }: Props) {

  function run(runs: number) {
    routeAdminCommand({
      type: "SCORE_RUN",
      slug: matchId,
      runs
    });
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg space-y-6">

      <h3 className="text-xl font-bold">Admin Scoring Panel</h3>

      {/* RUN BUTTONS */}

      <div className="flex gap-3 flex-wrap">
        {[0,1,2,3].map(r => (
          <button
            key={r}
            onClick={() => run(r)}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            {r}
          </button>
        ))}

        <button
          onClick={() => routeAdminCommand({ type: "SCORE_FOUR", slug: matchId })}
          className="bg-green-600 px-4 py-2 rounded"
        >
          4
        </button>

        <button
          onClick={() => routeAdminCommand({ type: "SCORE_SIX", slug: matchId })}
          className="bg-purple-600 px-4 py-2 rounded"
        >
          6
        </button>
      </div>

      {/* WICKET / EXTRAS */}

      <div className="flex gap-3 flex-wrap">

        <button
          onClick={() => routeAdminCommand({ type: "SCORE_WICKET", slug: matchId })}
          className="bg-red-600 px-4 py-2 rounded"
        >
          Wicket
        </button>

        <button
          onClick={() => routeAdminCommand({ type: "SCORE_WIDE", slug: matchId })}
          className="bg-yellow-600 px-4 py-2 rounded"
        >
          Wide
        </button>

        <button
          onClick={() => routeAdminCommand({ type: "SCORE_NOBALL", slug: matchId })}
          className="bg-orange-600 px-4 py-2 rounded"
        >
          No Ball
        </button>

      </div>

    </div>
  );
}