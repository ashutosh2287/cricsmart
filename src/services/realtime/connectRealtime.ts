import { routeRealtimeEvent } from "./realtimeRouter";
import type { RealtimeEvent } from "./realtimeRouter";
import { getMatchMeta } from "@/store/matchStore";
import { hydrateMatchState } from "@/services/matchEngine";
import { setMatchState } from "@/lib/eventStore";

const MAX_BACKOFF_MS = 10000;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_EXPONENT = 5;
const BACKOFF_JITTER_MS = 250;
const SIMULATION_START_DELAY_MS = 500;

export type ConnectRealtimeOptions = {
  autoStartSimulation?: boolean;
};

export type RealtimeConnectionState = {
  socket: EventSource | null;
  activeMatchId: string | null;
  manuallyClosed: boolean;
  subscribers: number;
  subscriberIds: Set<string>;
  reconnectTimer: number | null;
  reconnectAttempts: number;
  autoStartSimulation: boolean;
};

const state: RealtimeConnectionState = {
  socket: null,
  activeMatchId: null,
  manuallyClosed: false,
  subscribers: 0,
  subscriberIds: new Set(),
  reconnectTimer: null,
  reconnectAttempts: 0,
  autoStartSimulation: true,
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
  const baseDelay = Math.min(
    MAX_BACKOFF_MS,
    BASE_BACKOFF_MS * 2 ** Math.min(attempt, MAX_BACKOFF_EXPONENT)
  );
  const jitter = Math.floor(Math.random() * BACKOFF_JITTER_MS);
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
  const shouldStartSimulation =
    state.autoStartSimulation && state.reconnectAttempts === 0;

  es.addEventListener("CONNECTED", handleEvent);
  es.addEventListener("INITIAL_STATE", handleEvent);
  es.addEventListener("BALL_EVENT", handleEvent);
  es.addEventListener("commentary.generated", handleEvent);
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

  if (shouldStartSimulation) {
    setTimeout(() => {
      const matchMeta = getMatchMeta(matchId);
      if (!matchMeta) {
        console.error("ENGINE ERROR: missing match metadata");
        return;
      }
      if (!matchMeta.toss?.winner || !matchMeta.toss?.decision) {
        console.error("ENGINE ERROR: missing toss metadata");
        return;
      }

      fetch("/api/start-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          teamAName: matchMeta.teamA.name,
          teamBName: matchMeta.teamB.name,
          tossWinner: matchMeta.toss.winner,
          tossDecision: matchMeta.toss.decision,
        }),
      })
        .then((res) => res.json())
        .then(() => {
          console.log(`MATCH LIFECYCLE: simulation started for ${matchId}`);
        })
        .catch((err) => console.error("ENGINE ERROR: simulation start failed", err));
    }, SIMULATION_START_DELAY_MS);
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

export function connectRealtime(
  matchId: string,
  subscriberId: string,
  options?: ConnectRealtimeOptions
) {
  if (!matchId) {
    console.error("SSE ERROR: connectRealtime called without matchId");
    return;
  }
  if (typeof window === "undefined") return;

  state.subscriberIds.add(subscriberId);
  state.subscribers = state.subscriberIds.size;
  state.autoStartSimulation = options?.autoStartSimulation ?? true;

  const isAlreadyConnectedToMatch =
    state.socket &&
    state.activeMatchId === matchId &&
    (state.socket.readyState === EventSource.OPEN ||
      state.socket.readyState === EventSource.CONNECTING);

  if (isAlreadyConnectedToMatch) {
    return;
  }

  if (state.activeMatchId && state.activeMatchId !== matchId) {
    state.manuallyClosed = true;
    cleanupSocket();
  }

  state.activeMatchId = matchId;
  openSocket(matchId);
}

export function disconnectRealtime(matchId?: string, subscriberId?: string) {
  if (matchId && state.activeMatchId && state.activeMatchId !== matchId) return;

  if (subscriberId) {
    state.subscriberIds.delete(subscriberId);
  } else {
    state.subscriberIds.clear();
  }
  state.subscribers = state.subscriberIds.size;
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
    reconnectAttempts: state.reconnectAttempts,
  };
}
