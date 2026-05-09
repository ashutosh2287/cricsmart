import { routeRealtimeEvent } from "./realtimeRouter";
import type { RealtimeEvent } from "./realtimeRouter";
import { getMatchMeta } from "@/store/matchStore";

export type RealtimeConnectionState = {
  socket: EventSource | null;
  activeMatchId: string | null;
  manuallyClosed: boolean;
  subscribers: number;
  reconnectTimer: number | null;
};

const state: RealtimeConnectionState = {
  socket: null,
  activeMatchId: null,
  manuallyClosed: false,
  subscribers: 0,
  reconnectTimer: null,
};
const startedSimulationByMatch = new Set<string>();
const processedKeysByMatch = new Map<string, Set<string>>();

function hasProcessedEvent(matchId: string, key: string) {
  const processed = processedKeysByMatch.get(matchId);
  return processed?.has(key) ?? false;
}

function markProcessedEvent(matchId: string, key: string) {
  let processed = processedKeysByMatch.get(matchId);
  if (!processed) {
    processed = new Set<string>();
    processedKeysByMatch.set(matchId, processed);
  }
  processed.add(key);
}

function clearReconnectTimer() {
  if (state.reconnectTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
}

function cleanupSocket(options?: { preserveMatchId?: boolean }) {
  if (state.socket) {
    state.socket.onopen = null;
    state.socket.onmessage = null;
    state.socket.onerror = null;
    state.socket.close();
    state.socket = null;
  }
  clearReconnectTimer();
  if (!options?.preserveMatchId) {
    state.activeMatchId = null;
  }
}

function scheduleReconnect(matchId: string) {
  if (typeof window === "undefined") return;
  if (state.manuallyClosed) return;
  if (state.subscribers <= 0) return;
  if (state.activeMatchId !== matchId) return;
  if (state.reconnectTimer !== null) return;

  state.reconnectTimer = window.setTimeout(() => {
    state.reconnectTimer = null;
    if (state.manuallyClosed) return;
    if (state.subscribers <= 0) return;
    if (state.activeMatchId !== matchId) return;
    if (state.socket) return;
    openSocket(matchId);
  }, 1500);
}

function openSocket(matchId: string) {
  if (typeof window === "undefined") return;

  clearReconnectTimer();

  const url = new URL(
    `/api/realtime/${encodeURIComponent(matchId)}`,
    window.location.origin
  );

  // ─── Single clean handler ────────────────────────────────────────
  // Server sends all events as NAMED SSE events:
  //   event: BALL_EVENT\ndata: {...}\n\n
  // Named addEventListener fires exactly once per event — no
  // deduplication or message fallback needed.
  function handleEvent(event: MessageEvent) {
    if (!event?.data) return;

    try {
      const payload = JSON.parse(event.data) as RealtimeEvent;
      const payloadMatchId = payload.matchId || matchId;
      const committedState =
        payload.type === "BALL_EVENT" ? payload.data?.committedState : undefined;
      const inningsIndex = committedState?.currentInningsIndex ?? 0;
      const innings = committedState?.innings?.[inningsIndex];
      const processedKey =
        payload.type === "BALL_EVENT"
          ? `${payload.type}:${payloadMatchId}:${
              payload.data?.engineEvent?.id ??
              [
                inningsIndex,
                innings?.runs ?? 0,
                innings?.wickets ?? 0,
                innings?.over ?? 0,
                innings?.ball ?? 0,
              ].join("|")
            }`
          : `${payload.type}:${payloadMatchId}`;
      if (hasProcessedEvent(payloadMatchId, processedKey)) return;
      markProcessedEvent(payloadMatchId, processedKey);
      routeRealtimeEvent(payload);
    } catch (error) {
      console.error("❌ Failed to parse SSE event", error, event.data);
    }
  }

  const es = new EventSource(url.toString());

  // Register one listener per named event type
  es.addEventListener("CONNECTED", handleEvent);
  es.addEventListener("INITIAL_STATE", handleEvent);
  es.addEventListener("BALL_EVENT", handleEvent);
  es.addEventListener("MATCH_ENDED", handleEvent);
  es.addEventListener("SIMULATION_STATE_UPDATE", handleEvent);

  state.socket = es;
  state.activeMatchId = matchId;
  state.manuallyClosed = false;

  es.onopen = async () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("SSE_CONNECTED", { detail: { matchId } }));
    }
    try {
      const res = await fetch(`/api/match/${encodeURIComponent(matchId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("❌ Snapshot recovery request failed", res.status);
        return;
      }
      const snapshot = await res.json();
      if (snapshot?.success && snapshot?.match) {
        routeRealtimeEvent({
          type: "INITIAL_STATE",
          matchId,
          data: snapshot.match,
        });
      } else {
        console.error("❌ Snapshot recovery payload invalid");
        return;
      }
    } catch (error) {
      console.error("❌ Snapshot recovery failed", error);
      return;
    }

    const matchMeta = getMatchMeta(matchId);
    if (!matchMeta) return;
    if (startedSimulationByMatch.has(matchId)) return;
    startedSimulationByMatch.add(matchId);
    fetch("/api/start-simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        teamAName: matchMeta.teamA.name,
        teamBName: matchMeta.teamB.name,
        tossWinner: matchMeta.teamA.name,
        tossDecision: "BAT",
      }),
    }).catch((err) => console.error("❌ Simulation start failed:", err));
  };

  es.onerror = () => {
    if (state.socket !== es) return;
    if (state.manuallyClosed) return;
    if (es.readyState === EventSource.CONNECTING) return;
    if (es.readyState === EventSource.CLOSED) {
      cleanupSocket({ preserveMatchId: true });
      scheduleReconnect(matchId);
    }
  };
}

export function connectRealtime(matchId: string) {
  if (!matchId) {
    console.error("❌ connectRealtime: matchId undefined");
    return;
  }

  if (typeof window === "undefined") return;

  state.subscribers += 1;

  if (
    state.socket &&
    state.activeMatchId === matchId &&
    (state.socket.readyState === EventSource.OPEN ||
      state.socket.readyState === EventSource.CONNECTING)
  ) {
    return; // Already connected
  }

  if (state.activeMatchId && state.activeMatchId !== matchId) {
    state.manuallyClosed = true;
    cleanupSocket();
  }

  state.activeMatchId = matchId;
  openSocket(matchId);
}

export function disconnectRealtime(matchId?: string) {
  if (matchId && state.activeMatchId && state.activeMatchId !== matchId) return;

  state.subscribers = Math.max(0, state.subscribers - 1);
  if (state.subscribers > 0) return;

  state.manuallyClosed = true;
  if (state.activeMatchId) {
    processedKeysByMatch.delete(state.activeMatchId);
  }
  cleanupSocket();
}

export function forceReconnectRealtime(matchId: string) {
  if (typeof window === "undefined") return;
  if (!matchId) return;

  state.manuallyClosed = false;
  state.activeMatchId = matchId;
  cleanupSocket({ preserveMatchId: true });
  openSocket(matchId);
}

export function getRealtimeConnectionState() {
  return {
    matchId: state.activeMatchId,
    isConnected:
      state.socket?.readyState === EventSource.OPEN ||
      state.socket?.readyState === EventSource.CONNECTING,
    readyState: state.socket?.readyState ?? null,
    subscribers: state.subscribers,
  };
}
