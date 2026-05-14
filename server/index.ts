import http from "http";
import next from "next";
import { initSocket } from "./socket";
import { recoverRuntimeSessions } from "@/services/runtime/sessionRecovery";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.prepare().then(async () => {
  await recoverRuntimeSessions();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  // 🔥 attach socket.io
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
  });
});
