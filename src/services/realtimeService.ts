import { routeRealtimeEvent } from "@/services/realtimeRouter";

let socket: EventSource | null = null;
let activeMatchId: string | null = null;

export function connectRealtime(matchId: string) {

  // ✅ Prevent duplicate connection for same match
  if (socket && activeMatchId === matchId) {
    return;
  }

  // ✅ Close previous connection if switching matches
  if (socket) {
    socket.close();
    socket = null;
  }

  activeMatchId = matchId;

  socket = new EventSource(`/api/realtime/${matchId}`);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    routeRealtimeEvent(data);
  };

  socket.onerror = () => {
    console.warn("Realtime connection error");
  };
}

export function disconnectRealtime() {

  if (!socket) return;

  socket.close();
  socket = null;
  activeMatchId = null;
}