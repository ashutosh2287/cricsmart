"use client";

import { useEffect, useMemo, useState } from "react";

import {
  initReplay,
  playReplay,
  stopReplayUI,
  seekReplayUI,
} from "@/services/replay/replayController";
import { getMatchState } from "@/services/matchEngine";
import {
  getReplayState,
  setReplaySpeed,
} from "@/services/replay/replayEngine";

import { temporalIndex } from "@/services/matchEngine";

type ReplayOverlayProps = {
  onClose: () => void;
  matchId: string;
};

export default function ReplayOverlay({
  onClose,
  matchId,
}: ReplayOverlayProps) {

  

const [matchState, setMatchState] = useState(getMatchState(matchId));
const [replayMeta, setReplayMeta] = useState(getReplayState(matchId));
  const [currentIndex, setCurrentIndex] = useState(0);

  /*
  ====================================================
  INIT REPLAY (LOAD EVENTS FROM REDIS)
  ====================================================
  */
  useEffect(() => {
    initReplay(matchId);
  }, [matchId]);

  /*
  ====================================================
  POLL STATE (SIMPLE + RELIABLE)
  ====================================================
  */
  useEffect(() => {
  const interval = setInterval(() => {
    setMatchState(getMatchState(matchId));
    setReplayMeta(getReplayState(matchId));
  }, 100);

  return () => clearInterval(interval);
}, [matchId]);

  /*
  ====================================================
  TIMELINE LENGTH
  ====================================================
  */
  const timelineLength = useMemo(() => {
    return temporalIndex[matchId]?.length ?? 0;
  }, [matchId]);

  if (!matchState) return null;

const innings =
  matchState?.innings?.[matchState.currentInningsIndex];

if (!innings) return null;

  /*
  ====================================================
  HANDLERS
  ====================================================
  */

  function handleScrub(index: number) {
    setCurrentIndex(index);
    seekReplayUI(matchId, index);
  }

  function handlePlay() {
    playReplay(matchId);
  }

  function handlePause() {
    stopReplayUI(matchId);
  }

  function handleReverse() {
    // reverse = manual stepping for now
    const newIndex = Math.max(0, currentIndex - 1);
    handleScrub(newIndex);
  }

  function handleSpeed(speed: number) {
    setReplaySpeed(800 / speed); // adjust interval logic
  }

  /*
  ====================================================
  UI
  ====================================================
  */

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white p-6">

      <h2 className="text-3xl font-bold mb-6 tracking-wide">
        🎮 Replay Mode
      </h2>

      {/* SCORE */}
      <div className="text-2xl mb-2 font-semibold">
        {innings.runs}/{innings.wickets}
      </div>

      <div className="mb-6 text-lg opacity-80">
        Over {innings.over}.{innings.ball}
      </div>

      {/* SCRUBBER */}
      <div className="w-full max-w-2xl">

  <label htmlFor="replay-slider" className="sr-only">
    Replay timeline
  </label>

  <input
    id="replay-slider"
    type="range"
    min={0}
    max={Math.max(timelineLength - 1, 0)}
    value={currentIndex}
    onChange={(e) => handleScrub(Number(e.target.value))}
    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-500"
  />

  <div className="flex justify-between text-xs mt-2 opacity-70">
    <span>0</span>
    <span>{timelineLength} balls</span>
  </div>

</div>

      {/* CONTROLS */}
      <div className="flex gap-4 mt-6 flex-wrap justify-center">

        <button
          onClick={handlePause}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
        >
          ⏸ Pause
        </button>

        <button
          onClick={handlePlay}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
        >
          ▶ Play
        </button>

        <button
          onClick={handleReverse}
          className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded"
        >
          ⏪ Back
        </button>

        <button
          onClick={() => handleSpeed(0.5)}
          className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded"
        >
          0.5x
        </button>

        <button
          onClick={() => handleSpeed(2)}
          className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded"
        >
          2x
        </button>

      </div>

      {/* EXIT */}
      <button
        onClick={onClose}
        className="bg-red-500 hover:bg-red-600 transition px-6 py-2 rounded mt-8"
      >
        Exit Replay
      </button>

    </div>
  );
}