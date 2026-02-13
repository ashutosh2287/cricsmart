"use client";

import MatchCard from "./MatchCard";
import BroadcastOverlay from "./BroadcastOverlay";
import LiveCommentaryFeed from "./LiveCommentaryFeed";
import { Match } from "@/types/match";

type Props = {
  match: Match;
};

export default function BroadcastLiveView({ match }: Props) {

  return (
    <div className="space-y-6 relative">

      {/* 🔥 MatchCard reused for realtime + broadcast animations */}
      <MatchCard slug={match.slug} />

      {/* 🔥 Live Commentary Section */}
      <LiveCommentaryFeed />

      {/* 🔥 Cinematic overlay (top layer animation) */}
      <BroadcastOverlay />

    </div>
  );
}
