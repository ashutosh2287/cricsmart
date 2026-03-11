"use client";

import { useEffect, useMemo, useState } from "react";

import {
  subscribeReplay,
  getReplayState,
  getCursor,
  setCursorIndex as setReplayCursorIndex,
  setCursorPlaying,
  setCursorSpeed,
  setCursorDirection
} from "@/services/replayEngine";

import {
  scrubToPosition,
  playFromCurrentCursor
} from "@/services/replayController";

import { temporalIndex } from "@/services/matchEngine";

type ReplayOverlayProps = {
  onClose: () => void;
  matchId: string;
};

export default function ReplayOverlay({
  onClose,
  matchId
}: ReplayOverlayProps) {

  const [state, setState] = useState(getReplayState());
  const [cursorIndex, setCursorIndexLocal] = useState(0);

  /*
  ====================================================
  SUBSCRIBE TO REPLAY ENGINE
  ====================================================
  */

  useEffect(() => {

    const unsubscribe = subscribeReplay(() => {

      const newState = getReplayState();
      const cursor = getCursor();

      setState(newState);
      setCursorIndexLocal(cursor.index);

    });

    return unsubscribe;

  }, []);

  /*
  ====================================================
  TIMELINE LENGTH (FROM TEMPORAL INDEX)
  ====================================================
  */

  const timelineLength = useMemo(() => {
    return temporalIndex[matchId]?.length ?? 0;
  }, [matchId]);

  if (!state) return null;

  /*
  ====================================================
  SAFE INNINGS ACCESS
  ====================================================
  */

  const innings = state?.innings?.[state.currentInningsIndex];

  if (!innings) return null;

  /*
  ====================================================
  SCRUB USING INDEX
  ====================================================
  */

  function handleScrub(index: number) {

    setReplayCursorIndex(index);
    setCursorIndexLocal(index);

    scrubToPosition(matchId, index);

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

      {/* SCORE DISPLAY */}

      <div className="text-xl mb-2">
        Score: {innings.runs}/{innings.wickets}
      </div>

      <div className="mb-6 text-lg opacity-80">
        Over: {innings.over}.{innings.ball}
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

      {/* PLAYBACK CONTROLS */}

      <div className="flex gap-4 mt-6 flex-wrap justify-center">

        <button
          onClick={handlePause}
          className="bg-gray-700 px-4 py-2 rounded"
        >
          Pause
        </button>

        <button
          onClick={handlePlay}
          className="bg-green-600 px-4 py-2 rounded"
        >
          Play
        </button>

        <button
          onClick={handleReverse}
          className="bg-yellow-600 px-4 py-2 rounded"
        >
          Reverse
        </button>

        <button
          onClick={() => handleSpeed(0.5)}
          className="bg-purple-600 px-4 py-2 rounded"
        >
          0.5x
        </button>

        <button
          onClick={() => handleSpeed(2)}
          className="bg-purple-600 px-4 py-2 rounded"
        >
          2x
        </button>

      </div>

      {/* EXIT BUTTON */}

      <button
        onClick={onClose}
        className="bg-red-500 hover:bg-red-600 transition px-6 py-2 rounded mt-8"
      >
        Exit Replay
      </button>

    </div>

  );

}