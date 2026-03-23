"use client";

import { startReplay } from "@/services/replay/replayEngine";
import { loadHistoricalMatch } from "@/services/replay/loadHistoricalMatch";

type Props = {
  matchId: string;
};

export default function MatchControlPanel({ matchId }: Props) {

  async function startHistoricalReplay() {

    const events = await loadHistoricalMatch(matchId);

    if (!events.length) {
      console.warn("No historical events found for replay");
      return;
    }

    startReplay(matchId, events);
  }

  return (
    <div className="flex gap-3">

      <button
        onClick={startHistoricalReplay}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm"
      >
        ▶ Replay Match
      </button>

    </div>
  );
}