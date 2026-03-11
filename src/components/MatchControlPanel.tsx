"use client";

import MatchInsightPanel from "./MatchInsightPanel";
import WinProbabilityChart from "./WinProbabilityChart";
import MomentumMeter from "./MomentumMeter";
import HighlightTimeline from "./HighlightTimeline";
import NarrativeTimeline from "./NarrativeTimeline";
import PartnershipPanel from "./PartnershipPanel";
type Props = {
  matchId: string;
};

export default function MatchControlPanel({ matchId }: Props) {

  return (

    <div className="space-y-10">

      {/* MAIN ANALYTICS */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <WinProbabilityChart matchId={matchId} />

        <MomentumMeter matchId={matchId} />

      </div>

      {/* MATCH INSIGHTS */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <MatchInsightPanel matchId={matchId} />

        <NarrativeTimeline matchId={matchId} />

        <PartnershipPanel matchId={matchId} />

        <HighlightTimeline matchId={matchId} />

      </div>

    </div>

  );

}