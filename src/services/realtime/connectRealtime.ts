import { routeRealtimeEvent } from "./realtimeRouter";
import type { RealtimeEvent } from "./realtimeRouter";
import { getMatchMeta } from "@/store/matchStore";
import { hydrateMatchState } from "@/services/matchEngine";
import { setMatchState } from "@/lib/eventStore";

export type RealtimeConnectionState = {
  socket: EventSource | null;
  activeMatchId: string | null;
  manuallyClosed: boolean;
  subscribers: number;
  reconnectTimer: number | null;
  reconnectAttempts: number;
};

const state: RealtimeConnectionState = {
  socket: null,
  activeMatchId: null,
  manuallyClosed: false,
  subscribers: 0,
  reconnectTimer: null,
  reconnectAttempts: 0,
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

  const attempt = state.reconnectAttempts + 1;
  state.reconnectAttempts = attempt;
  const baseDelay = Math.min(10000, 500 * 2 ** Math.min(attempt, 5));
  const jitter = Math.floor(Math.random() * 250);
  const delay = baseDelay + jitter;

  state.reconnectTimer = window.setTimeout(() => {
    state.reconnectTimer = null;
    if (state.manuallyClosed) return;
    if (state.subscribers <= 0) return;
    if (state.activeMatchId !== matchId) return;
    if (state.socket) return;
    openSocket(matchId);
  }, delay);
}

async function refreshLatestSnapshot(matchId: string) {
  const res = await fetch(`/api/match/${encodeURIComponent(matchId)}`, {
    cache: "no-store",
  });
  if (!res.ok) return;

  const body = await res.json();
  if (!body?.success || !body?.match) return;

  hydrateMatchState(matchId, body.match);
  setMatchState(matchId, body.match);
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
    if (!event?.data) {
      console.warn("⚠️ Empty SSE event");
      return;
    }

    try {
      const payload = JSON.parse(event.data) as RealtimeEvent;
      routeRealtimeEvent(payload);
    } catch (error) {
      console.error("SSE ERROR: failed to parse SSE event", error, event.data);
    }
  }

  const es = new EventSource(url.toString());
  const shouldStartSimulation = state.reconnectAttempts === 0;

  // Register one listener per named event type
  es.addEventListener("CONNECTED", handleEvent);
  es.addEventListener("INITIAL_STATE", handleEvent);
  es.addEventListener("BALL_EVENT", handleEvent);
  es.addEventListener("MATCH_ENDED", handleEvent);
  es.addEventListener("SIMULATION_STATE_UPDATE", handleEvent);

  state.socket = es;
  state.activeMatchId = matchId;
  state.manuallyClosed = false;

  es.onopen = () => {
    state.reconnectAttempts = 0;
    refreshLatestSnapshot(matchId).catch((error) => {
      console.error("SSE ERROR: failed to refresh latest snapshot", error);
    });
  };

  // Start simulation after SSE opens
  if (shouldStartSimulation) {
    setTimeout(() => {
    const matchMeta = getMatchMeta(matchId);
    if (!matchMeta) {
      console.error("ENGINE ERROR: missing match metadata");
      return;
    }

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
    })
      .then((res) => res.json())
      .then(() => {
        console.log(`MATCH LIFECYCLE: simulation started for ${matchId}`);
      })
      .catch((err) => console.error("ENGINE ERROR: simulation start failed", err));
    }, 500);
  }

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
    console.error("SSE ERROR: connectRealtime called without matchId");
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
