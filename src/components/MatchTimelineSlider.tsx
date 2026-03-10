"use client";

import { useState, useMemo } from "react";
import { getEventStream } from "@/services/matchEngine";
import { scrubToPosition } from "@/services/replayController";

type Props = {
  matchId: string;
};

export default function MatchTimelineSlider({ matchId }: Props) {

  const maxIndex = useMemo(() => {

  const events = getEventStream(matchId) ?? [];

  return events.length > 0 ? events.length - 1 : 0;

}, [matchId]);

  const [position, setPosition] = useState(maxIndex);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {

    const index = Number(e.target.value);

    setPosition(index);

    scrubToPosition(matchId, index);
  }

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