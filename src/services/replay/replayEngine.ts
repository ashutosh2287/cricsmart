import { BallEvent } from "@/types/ballEvent";
import { dispatchBallEvent } from "../matchEngine";

const activeReplays: Record<string, NodeJS.Timeout> = {};
let replaySpeed = 800; // ms per ball (adjustable)

export function startReplay(
  matchId: string,
  events: BallEvent[]
) {

  if (activeReplays[matchId]) return;

  let index = 0;

  activeReplays[matchId] = setInterval(() => {

    if (index >= events.length) {
      stopReplay(matchId);
      return;
    }

    const event = events[index];

    dispatchBallEvent(matchId, {
      type: event.type,
      runs: event.runs,
      batsman: event.batsman,
      nonStriker: event.nonStriker,
      bowler: event.bowler
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