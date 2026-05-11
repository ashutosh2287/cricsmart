"use client";

import { useEffect, useState } from "react";
import {
  initReplay,
  getReplayEvents,
  seekReplayUI,
} from "@/services/replay/replayController";
import { getReplayState, subscribeReplay } from "@/services/replay/replayEngine";

type Props = {
  matchId: string;
};

export default function ReplaySlider({ matchId }: Props) {
  const [position, setPosition] = useState(0);
  const [eventsLength, setEventsLength] = useState(0);

  useEffect(() => {
    let cancelled = false;

    initReplay(matchId)
      .then(() => {
        if (cancelled) return;
        const replayState = getReplayState(matchId);
        const events = getReplayEvents(matchId);
        setPosition(replayState.index ?? 0);
        setEventsLength(events.length);
      })
      .catch(() => {
        if (cancelled) return;
        console.error("[ReplaySlider] Failed to initialize replay state");
        setEventsLength(getReplayEvents(matchId).length);
      });

    const unsubscribeReplay = subscribeReplay(() => {
      const replayState = getReplayState(matchId);
      setPosition(replayState.index ?? 0);
      setEventsLength(getReplayEvents(matchId).length);
    });

    return () => {
      cancelled = true;
      unsubscribeReplay();
    };
  }, [matchId]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const index = Number(e.target.value);

    setPosition(index);
    seekReplayUI(matchId, index);
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
