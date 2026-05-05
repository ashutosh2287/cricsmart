import { Server } from "socket.io";
import http from "http";

let io: Server | null = null;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });
  // 🔥 CONNECT ENGINE → SOCKET

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

export function emitToMatch(
  matchId: string,
  event: string,
  data: unknown
) {
  if (!io) return;
  io.to(matchId).emit(event, data);
}