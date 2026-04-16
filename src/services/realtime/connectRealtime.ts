import { routeRealtimeEvent } from "./realtimeRouter";

let socket: EventSource | null = null;
let activeMatchId: string | null = null;

export function connectRealtime(matchId: string) {
  if (!matchId) {
    console.error("❌ Cannot connect realtime without matchId");
    return;
  }

  if (socket && activeMatchId === matchId) {
    if (socket.readyState === EventSource.OPEN || socket.readyState === EventSource.CONNECTING) {
      console.log("⚠️ Already connected or connecting to this match:", matchId);
      return;
    }
  }

  if (socket && activeMatchId !== matchId) {
    socket.close();
    socket = null;
    console.log("🔌 Previous connection closed");
  }

  activeMatchId = matchId;

  console.log("🔌 Connecting to realtime:", matchId);

  const nextSocket = new EventSource(`/api/realtime/${matchId}`);
  socket = nextSocket;

  nextSocket.onopen = () => {
    console.log("✅ Realtime connected:", matchId);
  };

  nextSocket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📥 EVENT RECEIVED:", data?.type, "for", matchId);
      routeRealtimeEvent(data);
    } catch (err) {
      console.error("❌ Failed to parse SSE event", err);
    }
  };

  nextSocket.onerror = (err) => {
    console.error("❌ SSE connection error", err, {
      matchId,
      readyState: nextSocket.readyState,
    });

    if (nextSocket.readyState === EventSource.CLOSED) {
      console.warn("🔌 SSE closed for match:", matchId);
      if (socket === nextSocket) {
        socket = null;
      }
      if (activeMatchId === matchId) {
        activeMatchId = null;
      }
    }
  };
}

export function disconnectRealtime(matchId?: string) {
  if (!socket) return;

  if (matchId && activeMatchId !== matchId) {
    return;
  }

  socket.close();
  socket = null;
  activeMatchId = null;
  console.log("🔌 Realtime disconnected");
}