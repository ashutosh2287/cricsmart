"use client";

import { useEffect, useState } from "react";
import { subscribeDirectorSignal } from "@/services/directorSignalBus";

type Props = {
  matchId: string;
};

type Story = {
  id: number;
  title: string;
  description: string;
  color: string;
};

export default function MatchNarrativePanel({ matchId }: Props) {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    let counter = 0;

    const unsubscribe = subscribeDirectorSignal((signal) => {
      if (signal.matchId !== matchId) return;

      let story: Story | null = null;

      switch (signal.type) {
        case "TURNING_POINT_ALERT":
          story = {
            id: counter++,
            title: "🎯 Turning Point",
            description: "Match direction shifting rapidly",
            color: "border-yellow-500"
          };
          break;

        case "COLLAPSE_ALERT":
          story = {
            id: counter++,
            title: "🚨 Collapse Alert",
            description: "Batting side collapsing under pressure",
            color: "border-red-500"
          };
          break;

        case "ASSAULT_PHASE":
          story = {
            id: counter++,
            title: "💥 Assault Phase",
            description: "Batting side launching aggressive attack",
            color: "border-orange-500"
          };
          break;

        case "STRANGLE_ALERT":
          story = {
            id: counter++,
            title: "🧱 Pressure Build",
            description: "Bowling side tightening control",
            color: "border-blue-500"
          };
          break;

        case "MOMENTUM_STORY":
          story = {
            id: counter++,
            title: "📈 Momentum Shift",
            description:
              signal.direction === "BATTING"
                ? "Momentum favoring batting side"
                : "Bowling side gaining control",
            color: "border-purple-500"
          };
          break;

        case "DOMINANCE_PHASE":
          story = {
            id: counter++,
            title: "🏆 Dominance",
            description:
              signal.team === "BATTING"
                ? "Batting side dominating the game"
                : "Bowling side dominating the match",
            color: "border-green-500"
          };
          break;
      }

      if (!story) return;

      setStories((prev) => [story!, ...prev].slice(0, 8));
    });

    return () => unsubscribe();
  }, [matchId]);

  return (
    <div className="bg-[#020617]/80 backdrop-blur-md 
                    border border-gray-800 rounded-xl p-4 text-white shadow-xl">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
          Match Narrative
        </h2>
        <span className="text-xs text-gray-500">Live</span>
      </div>

      {/* STORIES */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">

        {stories.length === 0 && (
          <div className="text-gray-500 text-xs">
            Waiting for match story...
          </div>
        )}

        {stories.map((story) => (
          <div
            key={story.id}
            className={`border-l-4 ${story.color} 
                        bg-white/5 hover:bg-white/10 
                        transition-all duration-300 
                        rounded-lg p-3 animate-fade-in`}
          >
            <div className="text-sm font-semibold">
              {story.title}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {story.description}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}