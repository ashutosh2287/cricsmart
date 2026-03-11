import { subscribeDirectorSignal, emitDirectorSignal } from "../directorSignalBus";
import { DirectorSignal } from "../directorSignals";

const collapseCounter: Record<string, number> = {};
const assaultCounter: Record<string, number> = {};

export function initMatchNarrativeDirector() {

  subscribeDirectorSignal((signal: DirectorSignal) => {

    const matchId = signal.matchId;

    if (!collapseCounter[matchId]) collapseCounter[matchId] = 0;
    if (!assaultCounter[matchId]) assaultCounter[matchId] = 0;

    switch (signal.type) {

      /*
      ------------------------------------------------
      MOMENTUM → ASSAULT PHASE
      ------------------------------------------------
      */

      case "MOMENTUM_UPDATE":

        if (signal.value >= 4) {

          assaultCounter[matchId]++;

          if (assaultCounter[matchId] >= 2) {

            emitDirectorSignal({
              type: "ASSAULT_PHASE",
              matchId: signal.matchId,
              branchId: signal.branchId,
              eventId: signal.eventId,
              intensity: assaultCounter[matchId]
            });

          }

        } else {

          assaultCounter[matchId] = 0;

        }

        break;

      /*
      ------------------------------------------------
      WICKET CLUSTER → COLLAPSE
      ------------------------------------------------
      */

      case "HIGHLIGHT_DETECTED":

        if (signal.subtype === "WICKET") {

          collapseCounter[matchId]++;

          if (collapseCounter[matchId] >= 2) {

            emitDirectorSignal({
              type: "COLLAPSE_ALERT",
              matchId: signal.matchId,
              branchId: signal.branchId,
              eventId: signal.eventId,
              intensity: collapseCounter[matchId]
            });

          }

        }

        break;

      /*
      ------------------------------------------------
      PRESSURE SPIKE → STRANGLE
      ------------------------------------------------
      */

      case "PRESSURE_SPIKE":

        emitDirectorSignal({
          type: "STRANGLE_ALERT",
          matchId: signal.matchId,
          branchId: signal.branchId,
          eventId: signal.eventId,
          intensity: 1
        });

        break;

    }

  });

}