"use client";

import MatchCard from "./MatchCard";
import BroadcastOverlay from "./BroadcastOverlay";
import { Match } from "@/types/match";

type Props = {
  match: Match;
};

export default function BroadcastLiveView({ match }: Props) {

  return (
    <div className="space-y-6">

      {/* 🔥 MatchCard reused for broadcast animations */}
      <MatchCard slug={match.slug} />

      {/* 🔥 Cinematic overlay */}
      <BroadcastOverlay />

    </div>
  );
}
