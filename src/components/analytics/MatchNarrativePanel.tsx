"use client";

import { memo, useEffect, useState } from "react";
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

function MatchNarrativePanel({ matchId }: Props) {
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
            color: "var(--accent)"
          };
          break;

        case "COLLAPSE_ALERT":
          story = {
            id: counter++,
            title: "🚨 Collapse Alert",
            description: "Batting side collapsing under pressure",
            color: "var(--danger)"
          };
          break;

        case "ASSAULT_PHASE":
          story = {
            id: counter++,
            title: "💥 Assault Phase",
            description: "Batting side launching aggressive attack",
            color: "var(--accent)"
          };
          break;

        case "STRANGLE_ALERT":
          story = {
            id: counter++,
            title: "🧱 Pressure Build",
            description: "Bowling side tightening control",
            color: "var(--brand)"
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
<<<<<<< HEAD
            color: "border-[var(--accent-brand)]"
=======
            color: "var(--brand)"
>>>>>>> origin/copilot/dark-light-mode-fix
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
            color: "var(--brand)"
          };
          break;
      }

      if (!story) return;

      setStories((prev) => [story!, ...prev].slice(0, 8));
    });

    return () => unsubscribe();
  }, [matchId]);

  return (
<<<<<<< HEAD
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-[var(--text-primary)] shadow-[var(--shadow-card)]">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
          Match Narrative
        </h2>
        <span className="text-xs text-[var(--text-muted)]">Live</span>
=======
    <div
      className="backdrop-blur-md rounded-xl p-4 shadow-xl"
      style={{
        background: "var(--surface)",
        border: "0.5px solid var(--border)",
        color: "var(--text-1)",
      }}
    >

      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
          Match Narrative
        </h2>
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          Live
        </span>
>>>>>>> origin/copilot/dark-light-mode-fix
      </div>

      {/* STORIES */}
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">

        {stories.length === 0 && (
<<<<<<< HEAD
          <div className="text-[var(--text-muted)] text-xs">
=======
          <div className="text-xs" style={{ color: "var(--text-3)" }}>
>>>>>>> origin/copilot/dark-light-mode-fix
            Waiting for match story...
          </div>
        )}

        {stories.map((story) => (
          <div
            key={story.id}
<<<<<<< HEAD
            className={`border-l-4 ${story.color} bg-[var(--bg-overlay)] transition-all duration-300 rounded-lg p-3 animate-fade-in`}
=======
            className="border-l-4 bg-[var(--surface-2)] transition-all duration-300 rounded-lg p-3 animate-fade-in hover:bg-[var(--surface-3)]"
            style={{ borderLeftColor: story.color }}
>>>>>>> origin/copilot/dark-light-mode-fix
          >
            <div className="text-sm font-semibold">
              {story.title}
            </div>
<<<<<<< HEAD
            <div className="text-xs text-[var(--text-muted)] mt-1">
=======
            <div className="text-xs mt-1" style={{ color: "var(--text-2)" }}>
>>>>>>> origin/copilot/dark-light-mode-fix
              {story.description}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

const MemoizedMatchNarrativePanel = memo(MatchNarrativePanel);

MemoizedMatchNarrativePanel.displayName = "MatchNarrativePanel";

export default MemoizedMatchNarrativePanel;
