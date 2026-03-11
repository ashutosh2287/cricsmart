import { subscribeDirectorSignal } from "../directorSignalBus";
import { emitBroadcastCommand } from "../broadcastCommands";
import { DirectorSignal } from "../directorSignals";

export function initAIBroadcastDirector() {

  subscribeDirectorSignal((signal: DirectorSignal) => {

    switch (signal.type) {

      /*
      ------------------------------------------
      HIGHLIGHTS
      ------------------------------------------
      */

      case "HIGHLIGHT_DETECTED":

        if (signal.subtype === "SIX") {

          emitBroadcastCommand({
            type: "CAMERA_SHAKE",
            intensity: 2
          });

        }

        if (signal.subtype === "FOUR") {

          emitBroadcastCommand({
            type: "CAMERA_SWEEP",
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

      /*
      ------------------------------------------
      MOMENTUM SURGE
      ------------------------------------------
      */

      case "ASSAULT_PHASE":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "ASSAULT_PHASE"
        });

        break;

      /*
      ------------------------------------------
      COLLAPSE MOMENT
      ------------------------------------------
      */

      case "COLLAPSE_ALERT":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "COLLAPSE_ALERT"
        });

        break;

      /*
      ------------------------------------------
      BOWLING STRANGLE
      ------------------------------------------
      */

      case "STRANGLE_ALERT":

        emitBroadcastCommand({
          type: "SHOW_OVERLAY",
          overlay: "STRANGLE_ALERT"
        });

        break;

      /*
      ------------------------------------------
      PRESSURE BUILDING
      ------------------------------------------
      */

      case "PRESSURE_SPIKE":

        emitBroadcastCommand({
          type: "ENTER_TENSION"
        });

        break;

      default:
        break;

    }

  });

}