import { NextRequest } from "next/server";
import { getMatchState, initMatch } from "@/services/matchEngine";
import {
  addClient,
  removeClient,
} from "@/services/realtime/realtimeController";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RealtimeClient = {
  id: string;
  send: (data: string) => void;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> } // ✅ FIXED
) {
  const { matchId } = await context.params; // ✅ FIXED

  console.log("🧠 SSE ROUTE MATCH ID:", matchId);

  if (!matchId) {
    console.error("❌ matchId is undefined in SSE route");
    return new Response("Invalid matchId", { status: 400 });
  }

  initMatch(matchId);

  const encoder = new TextEncoder();
  let closed = false;
  let keepAlive: ReturnType<typeof setInterval> | null = null;
  let client: RealtimeClient | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const cleanup = () => {
        if (closed) return;
        closed = true;

        if (keepAlive) {
          clearInterval(keepAlive);
          keepAlive = null;
        }

        if (client) {
          removeClient(matchId, client);
        }

        try {
          controller.close();
        } catch {}

        console.log("❌ SSE disconnected:", matchId, client?.id);
      };

      const safeEnqueue = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch (error) {
          console.error("❌ SSE enqueue failed", { matchId, error });
          cleanup();
        }
      };

      // ✅ CREATE CLIENT
      client = {
        id: crypto.randomUUID(),
        send: (data: string) => {
          safeEnqueue(data);
        },
      };

      // ✅ ADD CLIENT
      console.log("🧠 BEFORE ADD CLIENT:", matchId);
      addClient(matchId, client);
      console.log("🧠 AFTER ADD CLIENT:", {
        matchId,
        totalClients: "check in controller log",
      });

      console.log("✅ SSE connected:", matchId, client.id);

      // ✅ INITIAL EVENTS
      safeEnqueue(`retry: 2000\n\n`);

      safeEnqueue(
        `event: CONNECTED\ndata: ${JSON.stringify({
          type: "CONNECTED",
          matchId,
        })}\n\n`
      );

      const initialState = getMatchState(matchId);
      if (initialState) {
        safeEnqueue(
          `event: INITIAL_STATE\ndata: ${JSON.stringify({
            type: "INITIAL_STATE",
            matchId,
            data: initialState,
          })}\n\n`
        );
      }

      // ✅ KEEP ALIVE
      keepAlive = setInterval(() => {
        safeEnqueue(`: keepalive\n\n`);
      }, 15000);

      // ✅ FIXED ABORT HANDLER
      req.signal.addEventListener("abort", () => {
        console.log("⚠️ ABORT SIGNAL RECEIVED");
        cleanup();
      });
    },

    cancel() {
      if (keepAlive) {
        clearInterval(keepAlive);
        keepAlive = null;
      }

      if (client) {
        removeClient(matchId, client);
      }

      closed = true;
      console.log("ℹ️ SSE stream cancelled:", matchId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}