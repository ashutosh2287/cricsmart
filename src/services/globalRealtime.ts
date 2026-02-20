import { createRealtimeRouter } from "./realtimeRouter";
import { dispatchBallEvent } from "@/services/matchEngine";
import { Match } from "../types/match";

let eventSource: EventSource | null = null;

export function startGlobalRealtime() {

  if (eventSource) return;

  eventSource = new EventSource("/api/realtime");

  createRealtimeRouter(eventSource, {

    onMatchUpdate: (match: Match) => {

      /*
      ------------------------------------------------
      TEMP CONVERSION:
      Server sends Match → convert to EngineBallEvent
      ------------------------------------------------

      (Later backend should send real events)
      */

      // Example fake mapping — adjust if needed
      dispatchBallEvent(match.slug, { type: "RUN", runs: 1 });

    }

  });

}