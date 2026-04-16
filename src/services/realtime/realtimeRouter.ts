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

function emitCricUpdate(detail: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("CRIC_UPDATE", {
      detail,
    })
  );
}

export function routeRealtimeEvent(event: RealtimeEvent) {
  console.log("📡 ROUTER RECEIVED:", event.type, "for", event.matchId);

  switch (event.type) {
    case "CONNECTED":
      handleConnected(event);
      break;

    case "BALL_EVENT":
      handleBallEvent(event);
      break;

    case "MATCH_ENDED":
      handleMatchEnd(event);
      break;

    default:
      console.warn("⚠️ Unknown realtime event", event);
  }
}

function handleConnected(
  event: Extract<RealtimeEvent, { type: "CONNECTED" }>
) {
  console.log("🟢 Connected to match:", event.matchId || "UNKNOWN");

  emitCricUpdate({
    matchId: event.matchId,
    type: "CONNECTED",
  });
}

function handleBallEvent(
  event: Extract<RealtimeEvent, { type: "BALL_EVENT" }>
) {
  const { matchId, data } = event;

  if (!matchId) {
    console.warn("⚠️ Missing matchId in BALL_EVENT", event);
    return;
  }

  if (!data?.engineEvent) {
    console.warn("⚠️ Missing engineEvent", event);
    return;
  }

  console.log("📤 Dispatching to matchEngine", matchId);
  dispatchBallEvent(matchId, data.engineEvent);

  if (typeof window !== "undefined") {
    window.__CRIC_STATE__ = {
      ...window.__CRIC_STATE__,
      teams: data.teams ?? window.__CRIC_STATE__?.teams,
      simulationState:
        data.simulationState ?? window.__CRIC_STATE__?.simulationState,
    };
  }

  emitCricUpdate({
    matchId,
    type: "BALL_EVENT",
    engineEvent: data.engineEvent,
  });
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

  emitCricUpdate({
    matchId,
    type: "MATCH_ENDED",
    winner: data?.winner,
    winBy: data?.winBy,
  });
}