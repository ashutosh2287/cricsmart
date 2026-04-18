import { BallEvent } from "@/types/ballEvent";
import {
  dispatchBallEvent,
  resetMatchState,
  getMatchState,
} from "../matchEngine";
import { clearTimeline } from "../broadcastTimeline";
import { toEngineEvent } from "@/services/simulation/simulationEventAdapter";
import { getNearestSnapshot } from "./snapshotStore";

// 🔥 Active replay timers
const activeReplays: Record<string, NodeJS.Timeout> = {};

// 🔥 Replay runtime state
const replayState: Record<
  string,
  {
    index: number;
    isPlaying: boolean;
    isReplayMode: boolean;
  }
> = {};

let replaySpeed = 800;

// 🧠 Helper → safely get teams from engine
function getCurrentTeams(matchId: string) {
  const matchState = getMatchState(matchId);

  const innings =
    matchState?.innings?.[matchState.currentInningsIndex];

  return {
    battingTeam: innings?.battingTeam ?? "Unknown",
    bowlingTeam: innings?.bowlingTeam ?? "Unknown",
  };
}

// 🚀 START REPLAY
export function startReplay(matchId: string, events: BallEvent[]) {
  if (activeReplays[matchId]) {
    stopReplay(matchId);
  }

  resetMatchState(matchId);
  clearTimeline(matchId);

  let index = 0;

  replayState[matchId] = {
    index: 0,
    isPlaying: true,
    isReplayMode: true,
  };

  activeReplays[matchId] = setInterval(() => {
    if (index >= events.length) {
      stopReplay(matchId);
      return;
    }

    const event = events[index];

    const { battingTeam, bowlingTeam } = getCurrentTeams(matchId);

    const engineEvent = toEngineEvent({
      ...event,
      batsman: event.batsman ?? "Unknown",
      nonStriker: event.nonStriker ?? "Unknown",
      bowler: event.bowler ?? "Unknown",
      battingTeam,
      bowlingTeam,
    });

    dispatchBallEvent(matchId, engineEvent);

    replayState[matchId].index = index;

    index++;
  }, replaySpeed);
}

// 🛑 STOP REPLAY
export function stopReplay(matchId: string) {
  const replay = activeReplays[matchId];

  if (replay) {
    clearInterval(replay);
    delete activeReplays[matchId];
  }

  if (replayState[matchId]) {
    replayState[matchId].isPlaying = false;
    replayState[matchId].isReplayMode = false;
  }
}

// ⚡ SET SPEED
export function setReplaySpeed(speed: number) {
  replaySpeed = speed;
}

// 🎯 SNAPSHOT SEEK (INSTANT JUMP)
export function replayTillIndex(
  matchId: string,
  events: BallEvent[],
  targetIndex: number
) {
  stopReplay(matchId);

  resetMatchState(matchId);
  clearTimeline(matchId);

  // 🔥 STEP 1: restore snapshot
  const snapshot = getNearestSnapshot(matchId, targetIndex);

  let startIndex = 0;

  if (snapshot) {
    const matchState = getMatchState(matchId);

    if (matchState) {
      Object.assign(matchState, snapshot.state);
      startIndex = snapshot.index;
    }
  }

  // 🔥 STEP 2: replay remaining events
  for (let i = startIndex; i <= targetIndex; i++) {
    const event = events[i];

    const { battingTeam, bowlingTeam } = getCurrentTeams(matchId);

    const engineEvent = toEngineEvent({
      ...event,
      batsman: event.batsman ?? "Unknown",
      nonStriker: event.nonStriker ?? "Unknown",
      bowler: event.bowler ?? "Unknown",
      battingTeam,
      bowlingTeam,
    });

    dispatchBallEvent(matchId, engineEvent);
  }

  replayState[matchId] = {
    index: targetIndex,
    isPlaying: false,
    isReplayMode: true,
  };
}

// 📊 GET REPLAY STATE
export function getReplayState(matchId: string) {
  return (
    replayState[matchId] || {
      index: 0,
      isPlaying: false,
      isReplayMode: false,
    }
  );
}