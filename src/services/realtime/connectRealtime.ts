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

  // ✅ DEFINE HANDLER FIRST
  function handleEvent(event: MessageEvent) {
    console.log("🧠 FULL SSE EVENT RECEIVED:", {
      type: event.type,
      raw: event.data,
    });

    if (!event?.data) {
      console.warn("⚠️ Empty SSE event received");
      return;
    }

    try {
      const payload = JSON.parse(event.data);

      console.log("📥 EVENT TYPE:", payload.type);

      routeRealtimeEvent(payload);
    } catch (error) {
      console.error("❌ Failed to parse realtime event", error, event.data);
    }
  }

  // ✅ THEN CREATE SOCKET
  const es = new EventSource(url.toString());

  // ✅ REGISTER EVENTS
  es.addEventListener("CONNECTED", handleEvent);
  es.addEventListener("INITIAL_STATE", handleEvent);
  es.addEventListener("BALL_EVENT", handleEvent);
  es.addEventListener("MATCH_ENDED", handleEvent);

  // ❌ Ignore control events
  es.addEventListener(
  "SIMULATION_STATE_UPDATE",
  handleEvent
);

  // ✅ NOW assign state
  state.socket = es;
  state.activeMatchId = matchId;
  state.manuallyClosed = false;

  // 🔥 START SIMULATION (unchanged)
  setTimeout(() => {
    console.log("🚀 STARTING SIMULATION AFTER DELAY");

    const matchMeta = getMatchMeta(matchId);

    if (!matchMeta) {
      console.error("❌ Missing matchMeta");
      return;
    }

    fetch("/api/start-simulation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        matchId,
        teamAName: matchMeta.teamA.name,
        teamBName: matchMeta.teamB.name,
        tossWinner: matchMeta.teamA.name,
        tossDecision: "BAT",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ Simulation started:", data);
      })
      .catch((err) => {
        console.error("❌ Simulation start failed:", err);
      });
  }, 500);

  // ✅ ERROR HANDLING (unchanged)
  es.onerror = () => {
    if (state.socket !== es) return;
    if (state.manuallyClosed) return;

    if (es.readyState === EventSource.CONNECTING) return;

    if (es.readyState === EventSource.CLOSED) {
      cleanupSocket({ preserveMatchId: true });
      console.log("🔄 Reconnecting SSE...", { matchId });
      scheduleReconnect(matchId);
    }
  };
}

export function connectRealtime(matchId: string) {
  // 🔥 ADD HERE (VERY FIRST LINES)
  if (!matchId) {
    console.error("❌ FRONTEND matchId is undefined");
    return;
  }

  console.log("🧠 FRONTEND CONNECTING TO:", matchId);

  if (typeof window === "undefined") return;

  state.subscribers += 1;

  if (
    state.socket &&
    state.activeMatchId === matchId &&
    (state.socket.readyState === EventSource.OPEN ||
      state.socket.readyState === EventSource.CONNECTING)
  ) {
    return;
  }

  if (state.activeMatchId && state.activeMatchId !== matchId) {
    state.manuallyClosed = true;
    cleanupSocket();
  }

  state.activeMatchId = matchId;
  openSocket(matchId);
}

export function disconnectRealtime(matchId?: string) {
  if (matchId && state.activeMatchId && state.activeMatchId !== matchId) {
    return;
  }

  state.subscribers = Math.max(0, state.subscribers - 1);

  if (state.subscribers > 0) {
    return;
  }

  state.manuallyClosed = true;
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