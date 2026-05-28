"use client";

import { useEffect, useState } from "react";

import {
  initReplay,
  seekReplayUI,
  getReplayEvents,
} from "@/services/replay/replayController";

import { getReplayState } from "@/services/replay/replayEngine";
import { extractHighlights } from "@/services/replay/highlightEngine";

type Props = {
  matchId: string;
};

export default function MatchTimelineSlider({ matchId }: Props) {
  const [position, setPosition] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);

  const [highlights, setHighlights] = useState<{
    wickets: number[];
    sixes: number[];
    fours: number[];
  }>({
    wickets: [],
    sixes: [],
    fours: [],
  });

  /*
  ========================================
  INIT REPLAY + LOAD EVENTS
  ========================================
  */
  useEffect(() => {
    async function load() {
      await initReplay(matchId);

      const events = getReplayEvents(matchId);

      if (!events || events.length === 0) return;

      // set max index properly (NO HARDCODE)
      setMaxIndex(events.length - 1);

      // extract highlights
      const extracted = extractHighlights(events);

      setHighlights({
        wickets: extracted
          .filter((h) => h.type === "WICKET")
          .map((h) => h.index),

        sixes: extracted
          .filter((h) => h.type === "SIX")
          .map((h) => h.index),

        fours: extracted
          .filter((h) => h.type === "FOUR")
          .map((h) => h.index),
      });

      // sync initial position
      const state = getReplayState(matchId);
      if (state) setPosition(state.index);
    }

    load();
  }, [matchId]);

  /*
  ========================================
  SYNC WITH REPLAY ENGINE
  ========================================
  */
  useEffect(() => {
    const interval = setInterval(() => {
      const state = getReplayState(matchId);
      if (!state) return;

      setPosition(state.index);
    }, 120);

    return () => clearInterval(interval);
  }, [matchId]);

  /*
  ========================================
  HANDLE SLIDER
  ========================================
  */
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const index = Number(e.target.value);
    setPosition(index);
    seekReplayUI(matchId, index);
  }

  /*
  ========================================
  EXTERNAL SEEK (GRAPHS ETC)
  ========================================
  */
  useEffect(() => {
    function handleExternalSeek(e: Event) {
      const custom = e as CustomEvent<{ ballIndex: number }>;
      const index = custom.detail?.ballIndex;

      if (typeof index !== "number") return;

      setPosition(index);
      seekReplayUI(matchId, index);
    }

    window.addEventListener("timeline-seek", handleExternalSeek);

    return () => {
      window.removeEventListener("timeline-seek", handleExternalSeek);
    };
  }, [matchId]);

  /*
  ========================================
  UI
  ========================================
  */
  if (maxIndex <= 0) return null;

  return (
    <div className="bg-[var(--gradient-surface)] text-[var(--text-primary)] p-5 rounded-2xl shadow-xl border border-[var(--border-subtle)]">

      <h3 className="font-semibold mb-3 text-lg tracking-wide">
        📊 Match Timeline
      </h3>

      {/* LABEL */}
      <label htmlFor="timeline-slider" className="sr-only">
        Match timeline slider
      </label>

      {/* SLIDER */}
      <input
        id="timeline-slider"
        type="range"
        min={0}
        max={maxIndex}
        value={position}
        onChange={handleChange}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-500"
      />

      {/* MARKERS */}
      <div className="relative w-full mt-2 h-2">

        {/* WICKETS */}
        {highlights.wickets.map((i) => (
          <div
            key={"w" + i}
            className="absolute top-0 w-1 h-2 bg-red-500"
            style={{
              left: `${(i / maxIndex) * 100}%`,
            }}
            title={`Wicket at ball ${i + 1}`}
          />
        ))}

        {/* SIXES */}
        {highlights.sixes.map((i) => (
          <div
            key={"s" + i}
            className="absolute top-0 w-1 h-2 bg-purple-400"
            style={{
              left: `${(i / maxIndex) * 100}%`,
            }}
            title={`Six at ball ${i + 1}`}
          />
        ))}

        {/* FOURS */}
        {highlights.fours.map((i) => (
          <div
            key={"f" + i}
            className="absolute top-0 w-1 h-2 bg-blue-400"
            style={{
              left: `${(i / maxIndex) * 100}%`,
            }}
            title={`Four at ball ${i + 1}`}
          />
        ))}

      </div>

      {/* FOOTER */}
      <div className="flex justify-between text-xs mt-2 opacity-70">
        <span>Ball 1</span>
        <span>Ball {maxIndex + 1}</span>
      </div>

      {/* CURRENT POSITION */}
      <div className="text-center text-sm mt-3 opacity-80">
        Ball #{position + 1}
      </div>

    </div>
  );
}