import { NextRequest } from "next/server";
import {
  addClient,
  removeClient,
} from "@/services/realtime/realtimeController";
import { startSimulation } from "@/services/simulation/matchSimulator";
import { initMatch } from "@/services/matchEngine";
export const runtime = "nodejs";

// 🔥 GLOBAL FLAG (prevents multiple simulations)
const globalStore = globalThis as {
  __SIM_STARTED__?: Record<string, boolean>;
};

if (!globalStore.__SIM_STARTED__) {
  globalStore.__SIM_STARTED__ = {};
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await context.params;

  console.log("🔥 SSE connected:", matchId);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const client = {
        id: crypto.randomUUID(),
        send: (data: string) => {
          controller.enqueue(encoder.encode(data));
        },
      };

      // ✅ Add client
      addClient(matchId, client);
      console.log(`✅ Client registered for match ${matchId}`);

      // ✅ Initial handshake
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: "CONNECTED",
            matchId,
          })}\n\n`
        )
      );

      // 💡 Keep connection alive
      const keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`:\n\n`));
      }, 15000);

      // ❌ Handle disconnect
      req.signal.addEventListener("abort", () => {
        console.log("❌ SSE disconnected:", matchId);

        clearInterval(keepAlive);
        removeClient(matchId, client);
        controller.close();
      });
    },
  });

  // =====================================================
  // 🚀 START SIMULATION (OUTSIDE stream → FINAL FIX)
  // =====================================================

  

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}