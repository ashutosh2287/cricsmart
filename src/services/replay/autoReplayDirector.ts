import { subscribeDirectorSignal } from "../directorSignalBus";
import { emitDirectorSignal } from "../directorSignalBus";

export function initAutoReplayDirector() {

  subscribeDirectorSignal((signal) => {

    if (signal.type !== "HIGHLIGHT_DETECTED") return;

    if (signal.subtype === "WICKET") {

      emitDirectorSignal({
        type: "REPLAY_REQUEST",
        matchId: signal.matchId,
        branchId: signal.branchId,
        eventId: signal.eventId,
        replayType: "WICKET"
      });

    }

    if (signal.subtype === "SIX") {

      emitDirectorSignal({
        type: "REPLAY_REQUEST",
        matchId: signal.matchId,
        branchId: signal.branchId,
        eventId: signal.eventId,
        replayType: "BOUNDARY"
      });

    }

  });

}