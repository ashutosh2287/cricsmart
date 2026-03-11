import { DirectorSignal } from "../directorSignals";
import { emitDirectorSignal } from "../directorSignalBus";

type ReplayType = "WICKET" | "BOUNDARY" | "TURNING_POINT";

type ReplayRequest = {
  matchId: string;
  branchId: string;
  eventId: string;
  replayType: ReplayType;
  priority: number;
};

const replayQueue: ReplayRequest[] = [];

let replayActive = false;

/*
------------------------------------------------
PRIORITY MAP
------------------------------------------------
*/

const replayPriority: Record<ReplayType, number> = {
  WICKET: 3,
  TURNING_POINT: 2,
  BOUNDARY: 1
};

/*
------------------------------------------------
ENQUEUE REPLAY
------------------------------------------------
*/

export function enqueueReplay(signal: DirectorSignal) {

  if (signal.type !== "REPLAY_REQUEST") return;

  const request: ReplayRequest = {
    matchId: signal.matchId,
    branchId: signal.branchId,
    eventId: signal.eventId,
    replayType: signal.replayType,
    priority: replayPriority[signal.replayType]
  };

  replayQueue.push(request);

  processReplayQueue();
}

/*
------------------------------------------------
PROCESS QUEUE
------------------------------------------------
*/

function processReplayQueue() {

  if (replayActive) return;

  if (replayQueue.length === 0) return;

  replayQueue.sort((a, b) => b.priority - a.priority);

  const next = replayQueue.shift();

  if (!next) return;

  replayActive = true;

 emitDirectorSignal({
  type: "HIGHLIGHT_DETECTED",
  matchId: next.matchId,
  branchId: next.branchId,
  eventId: next.eventId,
  subtype: next.replayType === "BOUNDARY" ? "SIX" : "WICKET"
});
}

/*
------------------------------------------------
REPLAY FINISHED CALLBACK
------------------------------------------------
*/

export function onReplayFinished() {

  replayActive = false;

  processReplayQueue();

}