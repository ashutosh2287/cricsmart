"use client";

import { useState, useMemo, useEffect } from "react";
import { getEventStream } from "@/services/matchEngine";
import { seekReplay } from "@/services/replay/seekReplay";

type Props = {
  matchId: string;
};

export default function MatchTimelineSlider({ matchId }: Props) {

  const events = useMemo(() => {
    return getEventStream(matchId) ?? [];
  }, [matchId]);

  const maxIndex = events.length > 0 ? events.length - 1 : 0;

  const [position, setPosition] = useState(maxIndex);

  /*
  ========================================
  Sync slider with latest ball
  ========================================
  */

  useEffect(() => {
    setPosition(maxIndex);
  }, [maxIndex]);

  /*
  ========================================
  Handle slider drag
  ========================================
  */

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {

    const index = Number(e.target.value);

    setPosition(index);

    seekReplay(matchId, index);

  }

  /*
  ========================================
  Support graph click → timeline seek
  ========================================
  */

  useEffect(() => {

    function handleExternalSeek(e: Event) {

      const custom = e as CustomEvent<{ ballIndex: number }>;

      const index = custom.detail?.ballIndex;

      if (typeof index !== "number") return;

      setPosition(index);

      seekReplay(matchId, index);

    }

    window.addEventListener("timeline-seek", handleExternalSeek);

    return () => {
      window.removeEventListener("timeline-seek", handleExternalSeek);
    };

  }, [matchId]);

  if (maxIndex <= 0) return null;

  return (

    <div className="bg-gray-900 text-white p-4 rounded-xl">

      <h3 className="font-bold mb-2">
        Match Timeline
      </h3>

      <label htmlFor="timeline-slider" className="sr-only">
        Match timeline slider
      </label>

      <input
        id="timeline-slider"
        type="range"
        min={0}
        max={maxIndex}
        value={position}
        onChange={handleChange}
        className="w-full"
      />

      <div className="text-xs mt-2 flex justify-between">
        <span>Ball 1</span>
        <span>Ball {maxIndex + 1}</span>
      </div>

    </div>

  );

}