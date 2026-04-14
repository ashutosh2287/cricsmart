import { dispatchBallEvent } from "@/services/matchEngine";
import type { SimulationState } from "@/services/simulation/simulationState";


type TeamsPayload = {
  teamA: { name: string };
  teamB: { name: string };
};

type RealtimeEvent =
  | {
      type: "CONNECTED";
      matchId: string;
    }
  | {
      type: "BALL_EVENT";
      matchId: string;
      data: {
  engineEvent: Parameters<typeof dispatchBallEvent>[1];
  simulationState?: SimulationState;
  teams?: TeamsPayload;
};
    }
  | {
      type: "MATCH_ENDED";
      matchId: string;
      data: {
        winner?: string;
        winBy?: string;
      };
    };

export function routeRealtimeEvent(event: RealtimeEvent) {
  console.log("📡 ROUTER RECEIVED:", event.type);

  switch (event.type) {
    case "CONNECTED":
      console.log("🟢 Connected to match:", event.matchId || "UNKNOWN");
      break;


    case "BALL_EVENT":
      console.log("🆔 EVENT MATCH ID:", event.matchId);
      console.log("🏏 BALL EVENT RECEIVED", event);
      handleBallEvent(event);
      break;

    case "MATCH_ENDED":
      handleMatchEnd(event);
      break;

    default:
      console.warn("⚠️ Unknown realtime event", event);
  }
}

function handleBallEvent(
  event: Extract<RealtimeEvent, { type: "BALL_EVENT" }>
) {
  const { matchId, data } = event;

  if (!data?.engineEvent) {
    console.warn("⚠️ Missing engineEvent", event);
    return;
  }

  console.log("📤 Dispatching to matchEngine", matchId);
  dispatchBallEvent(matchId, data.engineEvent);

// 🔥 NEW: store teams + simulation state globally
if (typeof window !== "undefined") {
  window.__CRIC_STATE__ = {
    ...window.__CRIC_STATE__,
    teams: data.teams ?? window.__CRIC_STATE__?.teams,
    simulationState: data.simulationState
  };

  window.dispatchEvent(new Event("CRIC_UPDATE"));
}
}

function handleMatchEnd(
  event: Extract<RealtimeEvent, { type: "MATCH_ENDED" }>
) {
  const { matchId, data } = event;

  console.log("🏆 Match Ended:", {
    matchId,
    winner: data?.winner,
    winBy: data?.winBy,
  });
}