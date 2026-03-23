import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent } from "../matchEngine";
import { resetMatchState } from "../matchEngine"; // ADD THIS
import { clearTimeline } from "../broadcastTimeline";


const activeReplays: Record<string, NodeJS.Timeout> = {};
let replaySpeed = 800; // ms per ball (adjustable)


export function startReplay(
  matchId: string,
  events: BallEvent[]
) {

if (activeReplays[matchId]) {
  stopReplay(matchId); // stop previous replay
}
  // 🔥 FIX 1: RESET STATE
  resetMatchState(matchId);
  clearTimeline(matchId);

  let index = 0;

  activeReplays[matchId] = setInterval(() => {

    if (index >= events.length) {
      stopReplay(matchId);
      return;
    }

    const event = events[index];

    dispatchBallEvent(matchId, {
  id: event.id, // 🔥 PRESERVE ID
  type: event.type,
  runs: event.runs,
  batsman: event.batsman ?? "Unknown",
  nonStriker: event.nonStriker ?? "Unknown",
  bowler: event.bowler ?? "Unknown"
});

    index++;

  }, replaySpeed);
}

export function stopReplay(matchId: string) {

  const replay = activeReplays[matchId];

  if (!replay) return;

  clearInterval(replay);

  delete activeReplays[matchId];
}

export function setReplaySpeed(speed: number) {
  replaySpeed = speed;
}

export function replayTillIndex(
  matchId: string,
  events: BallEvent[],
  targetIndex: number
) {
  stopReplay(matchId);

  resetMatchState(matchId);
  clearTimeline(matchId);

  for (let i = 0; i <= targetIndex; i++) {
    const event = events[i];

    dispatchBallEvent(matchId, {
      id: event.id,
      type: event.type,
      runs: event.runs,
      batsman: event.batsman ?? "Unknown",
      nonStriker: event.nonStriker ?? "Unknown",
      bowler: event.bowler ?? "Unknown"
    });
  }
}