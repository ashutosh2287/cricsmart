// broadcastCommands.ts

/*
================================================
BROADCAST COMMAND TYPES
================================================
*/

export type BroadcastCommand =
  | { type: "CAMERA_SHAKE"; intensity: number }
  | { type: "CAMERA_SWEEP"; slug: string }
  | { type: "SHOW_OVERLAY"; overlay: string }
  | { type: "PLAY_SLOW_MOTION"; slug: string }
  | { type: "ENTER_TENSION" };

/*
================================================
COMMAND BUS (IN-MEMORY)
================================================
*/

type Listener = (command: BroadcastCommand) => void;

const listeners: Listener[] = [];

/*
------------------------------------------------
SUBSCRIBE
Animation layer will use this.
------------------------------------------------
*/
export function subscribeBroadcastCommand(listener: Listener) {
  listeners.push(listener);
}

/*
------------------------------------------------
EMIT
Director uses this.
------------------------------------------------
*/
export function emitBroadcastCommand(command: BroadcastCommand) {
  for (const listener of listeners) {
    listener(command);
  }
}