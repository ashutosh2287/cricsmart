import type { SimulationState } from "@/services/simulation/simulationState";
import { patchMatchRuntime } from "@/store/matchStore";
import { hydrateMatchState }
from "@/services/matchEngine";

import { setMatchState }
from "@/lib/eventStore";

type TeamsPayload = {
  teamA: { name: string };
  teamB: { name: string };
};

type SimulationRuntimePayload = {
  isRunning?: boolean;
  isPaused?: boolean;
  speed?: number;
};

type MatchStateLike = Parameters<typeof hydrateMatchState>[1];

export type RealtimeEvent =
  | {
      type: "CONNECTED";
      matchId: string;
    }
  | {
      type: "INITIAL_STATE";
      matchId: string;
      data: MatchStateLike;
    }
  | {
      type: "BALL_EVENT";
      matchId: string;
      data: {
  committedState: MatchStateLike; // 🔥 FIX
  simulationState?: SimulationState | SimulationRuntimePayload;
  teams?: TeamsPayload;
  engineEvent?: {
    id?: string;
  } | null;
  eventMeta?: {
    eventId: string;
    sequence: number;
    timestamp: number;
    matchId: string;
    innings: number;
    over: number;
    ball: number;
    eventType: string;
  } | null;

  // ✅ ADD THESE
  commentary?: unknown[];
insights?: unknown[];
analytics?: Record<string, unknown>;
};
    }
  | {
      type: "SIMULATION_STATE_UPDATE";
      matchId: string;
      data: {
        isRunning: boolean;
        isPaused: boolean;
        speed: number;
      };
    }
  | {
      type: "MATCH_ENDED";
      matchId: string;
      data: {
        winner?: string;
        winBy?: string | number;
      };
    };

const lastAcceptedEventIdByMatch = new Map<string, string>();
const lastAcceptedFingerprintByMatch = new Map<string, string>();

function emitCricUpdate(detail: Record<string, unknown>) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("CRIC_UPDATE", {
      detail,
    })
  );
}

function toSimulationRuntimePayload(
  simulationState?: SimulationState | SimulationRuntimePayload
): SimulationRuntimePayload | undefined {
  if (!simulationState || typeof simulationState !== "object") {
    return undefined;
  }

  const candidate = simulationState as Record<string, unknown>;

  return {
    isRunning:
      typeof candidate.isRunning === "boolean"
        ? candidate.isRunning
        : undefined,
    isPaused:
      typeof candidate.isPaused === "boolean"
        ? candidate.isPaused
        : undefined,
    speed: typeof candidate.speed === "number" ? candidate.speed : undefined,
  };
}

function updateWindowRuntime(data: {
  teams?: TeamsPayload;
  simulationState?: SimulationState | SimulationRuntimePayload;
}) {
  if (typeof window === "undefined") return;

  window.__CRIC_STATE__ = {
    ...window.__CRIC_STATE__,
    teams: data.teams ?? window.__CRIC_STATE__?.teams,
    simulationState:
      toSimulationRuntimePayload(data.simulationState) ??
      window.__CRIC_STATE__?.simulationState,
  };
}

function getInningsIndex(state: MatchStateLike): number {
  return typeof state?.currentInningsIndex === "number"
    ? state.currentInningsIndex
    : 0;
}

function getCurrentInnings(state: MatchStateLike) {
  return state?.innings?.[getInningsIndex(state)];
}

function getProgressFingerprint(state: MatchStateLike): string {
  const inningsIndex = getInningsIndex(state);
  const innings = getCurrentInnings(state);

  const runs = Number(innings?.runs ?? 0);
  const wickets = Number(innings?.wickets ?? 0);

  const overNumbers = innings?.overs
    ? Object.keys(innings.overs)
        .map(Number)
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)
    : [];

  const lastOver = overNumbers.length ? overNumbers[overNumbers.length - 1] : 0;
  const ballsInLastOver =
    innings?.overs && Array.isArray(innings.overs[lastOver])
      ? innings.overs[lastOver].length
      : 0;

  const striker = String(innings?.striker ?? "");
  const nonStriker = String(innings?.nonStriker ?? "");
  const bowler = String((innings as Record<string, unknown>)?.currentBowler ?? "");

  return [
    inningsIndex,
    runs,
    wickets,
    lastOver,
    ballsInLastOver,
    striker,
    nonStriker,
    bowler,
    state?.matchEnded ? 1 : 0,
  ].join("|");
}

function shouldAcceptInitialState(matchId: string, incoming: MatchStateLike) {
  const incomingFingerprint = getProgressFingerprint(incoming);
  const lastAcceptedFingerprint = lastAcceptedFingerprintByMatch.get(matchId);

  if (lastAcceptedFingerprint === incomingFingerprint) {
    return false;
  }

  return true;
}

function shouldAcceptBallState(
  matchId: string,
  incoming: MatchStateLike,
  engineEventId?: string
) {
  const lastAcceptedEventId = lastAcceptedEventIdByMatch.get(matchId);

  // ✅ PRIMARY FILTER → eventId
  if (engineEventId) {
    if (lastAcceptedEventId === engineEventId) {
      return false;
    }

    // 🔥 If eventId is new → ALWAYS ACCEPT
    return true;
  }

  // ⚠️ FALLBACK → fingerprint (only if no eventId)
  const incomingFingerprint = getProgressFingerprint(incoming);
  const lastAcceptedFingerprint = lastAcceptedFingerprintByMatch.get(matchId);

  if (lastAcceptedFingerprint === incomingFingerprint) {
    return false;
  }

  return true;
}

export function routeRealtimeEvent(event: RealtimeEvent) {
  if (!event?.matchId) {
    console.warn("⚠️ Realtime event missing matchId", event);
    return;
  }

  switch (event.type) {
    case "CONNECTED":
  emitCricUpdate({
    matchId: event.matchId,
    type: "CONNECTED",
  });
  return;

    case "INITIAL_STATE": {
  if (!event.data) {
    console.warn("⚠️ INITIAL_STATE missing data", event);
    return;
  }

  if (!shouldAcceptInitialState(event.matchId, event.data)) {
    return;
  }

  hydrateMatchState(event.matchId, event.data);

  // ✅ ADD THIS — push into eventStore so MatchProvider sees initial state
  setMatchState(event.matchId, event.data as import("@/services/matchEngine").MatchState);

  lastAcceptedFingerprintByMatch.set(
    event.matchId,
    getProgressFingerprint(event.data)
  );

  emitCricUpdate({
    matchId: event.matchId,
    type: "INITIAL_STATE",
  });
  return;
}

    case "BALL_EVENT": {
  if (!event.data?.committedState) {
    console.warn("⚠️ BALL_EVENT missing committed state", event);
    return;
  }

  const state = event.data.committedState;

  const engineEventId =
    event.data.eventMeta?.eventId ?? event.data.engineEvent?.id;

  if (!shouldAcceptBallState(event.matchId, state, engineEventId)) {
    return;
  }

 // ✅ ONLY update immutable realtime store
setMatchState(event.matchId, structuredClone(state));

  // ✅ 2. 🔥 ADD THIS BLOCK (UI STORE SYNC)
  const innings = state.innings[state.currentInningsIndex];

// ✅ derive over + ball from overs object
const overNumbers = innings?.overs
  ? Object.keys(innings.overs)
      .map(Number)
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
  : [];

const currentOver = overNumbers.length
  ? overNumbers[overNumbers.length - 1]
  : 0;

const currentBall =
  innings?.overs &&
  Array.isArray(innings.overs[currentOver])
    ? innings.overs[currentOver].length
    : 0;

patchMatchRuntime(event.matchId, {
  currentRuns: innings?.runs ?? 0,
  currentWickets: innings?.wickets ?? 0,
  currentOver,
  currentBall,
});

  // ✅ 3. Continue existing logic
  updateWindowRuntime(event.data);

  if (engineEventId) {
    lastAcceptedEventIdByMatch.set(event.matchId, engineEventId);
  }

  lastAcceptedFingerprintByMatch.set(
    event.matchId,
    getProgressFingerprint(state)
  );

  emitCricUpdate({
    matchId: event.matchId,
    type: "BALL_EVENT",
    eventMeta: event.data.eventMeta ?? null,
    simulationState:
      toSimulationRuntimePayload(event.data.simulationState) ?? null,
    commentary: event.data.commentary ?? [],
    insights: event.data.insights ?? [],
    analytics: event.data.analytics ?? null,
  });

  return;
}

    case "SIMULATION_STATE_UPDATE": {
      updateWindowRuntime({
        simulationState: event.data,
      });

      emitCricUpdate({
        matchId: event.matchId,
        type: "SIMULATION_STATE_UPDATE",
        simulationState: {
          isRunning: event.data.isRunning,
          isPaused: event.data.isPaused,
          speed: event.data.speed,
        },
      });
      return;
    }

    case "MATCH_ENDED": {
      emitCricUpdate({
        matchId: event.matchId,
        type: "MATCH_ENDED",
        winner: event.data?.winner,
        winBy: event.data?.winBy,
      });
      return;
    }

    default:
      console.warn("⚠️ Unknown realtime event", event);
  }
}
