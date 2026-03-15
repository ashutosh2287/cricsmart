"use client";

import MatchInsightPanel from "./MatchInsightPanel";
import WinProbabilityChart from "./WinProbabilityChart";
import MomentumMeter from "./MomentumMeter";
import HighlightTimeline from "./HighlightTimeline";
import NarrativeTimeline from "./NarrativeTimeline";
import PartnershipPanel from "./PartnershipPanel";

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

    <div className="space-y-10">

      {/* REPLAY CONTROLS */}

      <div className="flex gap-3">

        <button
          onClick={startHistoricalReplay}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm"
        >
          ▶ Replay Match
        </button>

      </div>

      {/* MAIN ANALYTICS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <WinProbabilityChart matchId={matchId} />

        <MomentumMeter matchId={matchId} />

      </div>

      {/* MATCH INSIGHTS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <MatchInsightPanel matchId={matchId} />

        <NarrativeTimeline matchId={matchId} />

        <PartnershipPanel matchId={matchId} />

        <HighlightTimeline matchId={matchId} />

      </div>

    </div>

  );

}