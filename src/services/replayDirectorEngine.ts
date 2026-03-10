// src/services/replayDirectorEngine.ts

import { subscribeDirectorSignal } from "./directorSignalBus";
import { emitBroadcastCommand } from "./broadcastCommands";
import { DirectorSignal } from "./directorSignals";

export function initReplayDirectorEngine() {

  subscribeDirectorSignal((signal: DirectorSignal) => {

    switch (signal.type) {

      case "HIGHLIGHT_DETECTED":

        if (signal.subtype === "SIX") {

          emitBroadcastCommand({
            type: "PLAY_SLOW_MOTION",
            slug: signal.eventId
          });

        }

        if (signal.subtype === "WICKET") {

          emitBroadcastCommand({
            type: "PLAY_SLOW_MOTION",
            slug: signal.eventId
          });

        }

        break;

      case "COLLAPSE_ALERT":

        emitBroadcastCommand({
          type: "PLAY_SLOW_MOTION",
          slug: signal.eventId
        });

        break;

      case "PRESSURE_SPIKE":

        emitBroadcastCommand({
          type: "CAMERA_SWEEP",
          slug: signal.eventId
        });

        break;

    }

  });

}