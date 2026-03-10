import { subscribeDirectorSignal } from "./directorSignalBus";
import { emitBroadcastCommand } from "./broadcastCommands";
import { DirectorSignal } from "./directorSignals";

export function initBroadcastGraphicsEngine() {

  subscribeDirectorSignal((signal: DirectorSignal) => {

    switch (signal.type) {

      case "COLLAPSE_ALERT":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "COLLAPSE_ALERT"
        });

        break;

      case "ASSAULT_PHASE":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "BATTING_ASSAULT"
        });

        break;

      case "STRANGLE_ALERT":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "BOWLING_DOMINANCE"
        });

        break;

      case "PANIC_MODE":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "CHASE_PRESSURE"
        });

        break;

      case "RECOVERY_PHASE":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "PARTNERSHIP_BUILDING"
        });

        break;

      case "PRESSURE_SPIKE":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "MATCH_TENSION"
        });

        break;

    }

  });

}