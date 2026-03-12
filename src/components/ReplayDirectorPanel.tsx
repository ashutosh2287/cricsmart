"use client";

import { getReplayQueue } from "@/services/replay/replayDirectorEngine";

export default function ReplayDirectorPanel({ matchId }: { matchId: string }) {

  const queue = getReplayQueue(matchId);

  if (!queue.length) return null;

  return (
    <div className="bg-black text-white p-4 rounded-xl">

      <h3 className="font-bold mb-3">
        Replay Director
      </h3>

      {queue.slice(0,5).map((r, i) => (

        <div
          key={i}
          className="bg-gray-800 p-2 rounded mb-2"
        >
          <div className="text-xs">
            Ball {r.ballIndex + 1}
          </div>

          <div className="text-sm font-semibold">
            {r.type.replace("_"," ")}
          </div>
        </div>

      ))}

    </div>
  );
}