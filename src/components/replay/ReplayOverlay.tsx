"use client";

import { useEffect, useMemo, useState } from "react";
import {
  subscribeReplay,
  getReplayState,
  getCursor,
  setCursorIndex,
  setCursorPlaying,
  setCursorSpeed,
  setCursorDirection
} from "@/services/replayEngine";
import { getMatchState } from "@/services/matchEngine";
import {
  scrubToPosition,
  playFromCurrentCursor
} from "@/services/replayController";

type ReplayOverlayProps = {
  onClose: () => void;
  matchId: string;
};

export default function ReplayOverlay({ onClose, matchId }: ReplayOverlayProps) {

  const [state, setState] = useState(getReplayState());
  const [cursorIndex, setCursorIndexLocal] = useState(0);

  /*
  ====================================================
  SUBSCRIBE TO REPLAY ENGINE
  ====================================================
  */

  useEffect(() => {
    return subscribeReplay(() => {
      setState(getReplayState());
      setCursorIndexLocal(getCursor().index);
    });
  }, []);

  /*
  ====================================================
  TIMELINE LENGTH (FROM TEMPORAL INDEX)
  ====================================================
  */

  const timelineLength = useMemo(() => {
    const liveState = getMatchState(matchId);
    return liveState?.timelineIndex?.length ?? 0;
  }, [matchId]);

  if (!state) return null;

  /*
  ====================================================
  SCRUB USING INDEX ONLY
  ====================================================
  */

  function handleScrub(index: number) {
    setCursorIndex(index);
    setCursorIndexLocal(index);

    scrubToPosition(matchId, index); 
    // IMPORTANT:
    // scrubToPosition must now accept index directly
  }

  /*
  ====================================================
  PLAYBACK CONTROLS
  ====================================================
  */

  function handlePlay() {
    setCursorDirection(1);
    setCursorPlaying(true);
    playFromCurrentCursor(matchId);
  }

  function handlePause() {
    setCursorPlaying(false);
  }

  function handleReverse() {
    setCursorDirection(-1);
    setCursorPlaying(true);
    playFromCurrentCursor(matchId);
  }

  function handleSpeed(speed: number) {
    setCursorSpeed(speed);
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white p-6">

      <h2 className="text-2xl font-bold mb-6 tracking-wide">
        REPLAY MODE
      </h2>

      <div className="text-xl mb-2">
        Score: {state.runs}/{state.wickets}
      </div>

      <div className="mb-6 text-lg opacity-80">
        Over: {state.over}.{state.ball}
      </div>

      {/* TIMELINE SCRUBBER */}

      <div className="w-full max-w-xl">

        <label htmlFor="replayScrubber" className="sr-only">
          Replay timeline scrubber
        </label>

        <input
          id="replayScrubber"
          type="range"
          min={0}
          max={Math.max(timelineLength - 1, 0)}
          value={cursorIndex}
          onChange={(e) => handleScrub(Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />

        <div className="flex justify-between text-xs mt-2 opacity-70">
          <span>Start</span>
          <span>{timelineLength} balls</span>
        </div>

      </div>

      {/* CONTROLS */}

      <div className="flex gap-4 mt-6 flex-wrap justify-center">

        <button onClick={handlePause} className="bg-gray-700 px-4 py-2 rounded">
          Pause
        </button>

        <button onClick={handlePlay} className="bg-green-600 px-4 py-2 rounded">
          Play
        </button>

        <button onClick={handleReverse} className="bg-yellow-600 px-4 py-2 rounded">
          Reverse
        </button>

        <button onClick={() => handleSpeed(0.5)} className="bg-purple-600 px-4 py-2 rounded">
          0.5x
        </button>

        <button onClick={() => handleSpeed(2)} className="bg-purple-600 px-4 py-2 rounded">
          2x
        </button>

      </div>

      <button
        onClick={onClose}
        className="bg-red-500 hover:bg-red-600 transition px-6 py-2 rounded mt-8"
      >
        Exit Replay
      </button>

    </div>
  );
}