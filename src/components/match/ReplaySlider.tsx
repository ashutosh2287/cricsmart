"use client";

import { useEffect, useState } from "react";
import {
  getReplayEvents,
  initReplay,
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
      .catch((error) => {
        if (cancelled) return;
        console.error(
          "[ReplaySlider] Failed to initialize replay state for match:",
          matchId,
          error
        );
        setEventsLength(0);
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

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const index = Number(event.target.value);
    setPosition(index);
    seekReplayUI(matchId, index);
  }

  if (eventsLength === 0) return null;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-colors duration-200 hover:border-white/10">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-sky-300/80">
            Replay
          </p>
          <h3 className="text-lg font-semibold text-white">Replay Timeline</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60">
          Ball {position} / {Math.max(eventsLength - 1, 0)}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex justify-between text-xs text-white/55">
          <span>Start</span>
          <span>Drag to revisit key moments</span>
          <span>Latest</span>
        </div>

        <label htmlFor="replay-slider" className="sr-only">
          Replay slider
        </label>

        <input
          id="replay-slider"
          type="range"
          min={0}
          max={eventsLength - 1}
          value={position}
          onChange={handleChange}
          className="w-full cursor-pointer accent-sky-400"
        />
      </div>
    </div>
  );
}
