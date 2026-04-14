import { routeRealtimeEvent } from "./realtimeRouter";

let socket: EventSource | null = null;
let activeMatchId: string | null = null;

export function connectRealtime(matchId: string) {
  // ✅ Prevent duplicate same match
  if (socket && activeMatchId === matchId) {
    console.log("⚠️ Already connected to this match");
    return;
  }

  // ❌ Close previous connection if switching match
  if (socket) {
    socket.close();
    console.log("🔌 Previous connection closed");
  }

  activeMatchId = matchId;

  console.log("🔌 Connecting to realtime:", matchId);
  console.log("🆔 CONNECTING TO:", matchId);

  socket = new EventSource(`/api/realtime/${matchId}`);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      console.log("📥 EVENT RECEIVED:", data.type); // 🔥 DEBUG

      routeRealtimeEvent(data);
    } catch (err) {
      console.error("❌ Failed to parse SSE event", err);
    }
  };

  socket.onerror = (err) => {
    console.error("❌ SSE connection error", err);
  };

  socket.onopen = () => {
    console.log("✅ Realtime connected");
  };
}

export function disconnectRealtime() {
  if (socket) {
    socket.close();
    socket = null;
    activeMatchId = null;
    console.log("🔌 Realtime disconnected");
  }
}