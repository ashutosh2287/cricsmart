"use client";

import MatchCard from "./MatchCard";
import BroadcastOverlay from "./BroadcastOverlay";
import LiveCommentaryFeed from "./LiveCommentaryFeed";
import { Match } from "@/types/match";
import MatchDramaMeter from "@/components/MatchDramaMeter";
import BroadcastInsightBanner from "@/components/BroadcastInsightBanner";
import MomentumMeter from "@/components/MomentumMeter";

type Props = {
  match: Match;
};

export default function BroadcastLiveView({ match }: Props) {

  return (
    <div className="space-y-6 relative">

      {/* Match card */}
      <MatchCard slug={match.slug} />

      {/* Live commentary */}
      <LiveCommentaryFeed />

      {/* Cinematic broadcast overlay */}
      <BroadcastOverlay />

      <BroadcastInsightBanner />

      {/* Match drama meter */}
      <div className="absolute top-4 right-4 z-20">
  <MatchDramaMeter matchId={match.slug} />
</div>
<MomentumMeter matchId={match.slug} />

    </div>
  );
}