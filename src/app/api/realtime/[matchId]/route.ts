import { NextRequest } from "next/server";
import { addClient, removeClient } from "@/services/realtime/realtimeController";
import { getMatchState, initMatch } from "@/services/matchEngine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RealtimeClient = {
  id: string;
  send: (data: string) => void;
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await context.params;

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
        } catch {
          // ignore already closed
        }

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

      client = {
        id: crypto.randomUUID(),
        send: (data: string) => {
          safeEnqueue(data);
        },
      };

      addClient(matchId, client);
      console.log("✅ SSE connected:", matchId, client.id);

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

      keepAlive = setInterval(() => {
        safeEnqueue(`: keepalive\n\n`);
      }, 15000);

      req.signal.addEventListener("abort", cleanup, { once: true });
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