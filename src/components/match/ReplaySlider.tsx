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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors duration-200 hover:border-[var(--border)]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="mb-0.5 text-[10px] uppercase tracking-[0.18em] text-sky-300/80">
            Replay
          </p>
          <h3 className="text-sm font-semibold text-[var(--text-1)]">Replay Timeline</h3>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[11px] text-[var(--text-3)]">
          Ball {position} / {Math.max(eventsLength - 1, 0)}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5">
        <div className="mb-2 flex justify-between text-[11px] text-[var(--text-3)]">
          <span>Start</span>
          <span>Drag to revisit moments</span>
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
