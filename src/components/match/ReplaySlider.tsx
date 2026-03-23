"use client";

import { useEffect, useMemo, useState } from "react";
import { getEventStream } from "@/services/matchEngine";
import {
  scrubToPosition,
  getReplayPosition
} from "@/services/replayController";

type Props = {
  matchId: string;
};

export default function ReplaySlider({ matchId }: Props) {

  const [position, setPosition] = useState(0);

  // 🔥 Load total balls
  const events = useMemo(() => {
  return getEventStream(matchId);
}, [matchId]);


const eventsLength = events.length;
  // 🔥 Sync position from store
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(getReplayPosition(matchId));
    }, 200);

    return () => clearInterval(interval);
  }, [matchId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const index = Number(e.target.value);

    setPosition(index);

    // 🔥 CORE: jump to that ball
    scrubToPosition(matchId, index);
  }

  if (eventsLength === 0) return null;

  return (
    <div className="bg-gray-900 p-3 rounded-xl mt-4">

      <div className="flex justify-between text-xs mb-1 text-gray-400">
        <span>0</span>
        <span>Ball {position}</span>
        <span>{eventsLength - 1}</span>
      </div>


<label htmlFor="replay-slider" className="sr-only">
  Replay Slider
</label>

<input
  id="replay-slider"
  type="range"
  min={0}
  max={eventsLength - 1}
  value={position}
  onChange={handleChange}
  className="w-full cursor-pointer"
/>

    </div>
  );
}