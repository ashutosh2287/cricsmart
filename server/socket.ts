import { Server } from "socket.io";
import http from "http";
import { broadcast } from "@/services/realtime/realtimeController";

let io: Server | null = null;

function resolveAllowedOrigins(): string[] {
  const values = (process.env.SOCKET_ALLOWED_ORIGINS ?? process.env.NEXT_PUBLIC_BASE_URL ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (values.length === 0 && process.env.NODE_ENV !== "production") {
    return ["http://localhost:3000"];
  }

  return values;
}

export function initSocket(server: http.Server) {
  const allowedOrigins = resolveAllowedOrigins();
  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length === 0 ? false : allowedOrigins,
    },
  });

  io.on("connection", (socket) => {
    console.log("⚡ client connected:", socket.id);

    socket.on("joinMatch", (matchId: string) => {
      socket.join(matchId);
      console.log(`📡 joined room: ${matchId}`);
    });

    socket.on("leaveMatch", (matchId: string) => {
      socket.leave(matchId);
    });

    socket.on("disconnect", () => {
      console.log("❌ disconnected:", socket.id);
    });
  });

  return io;
}

export function emitToMatch(matchId: string, event: string, data: unknown) {
  // Keep Socket.IO emit (for any future Socket.IO clients)
  if (io) {
    io.to(matchId).emit(event, data);
  }

  // ✅ BRIDGE TO SSE — this is what the frontend actually listens to
  broadcast(matchId, {
    type: event,
    matchId,
    data: data as Record<string, unknown>,
  });
}
