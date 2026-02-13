import { NextResponse } from "next/server";
import { subscribeRealtime } from "@/services/realtimeService";

export async function GET() {

  const encoder = new TextEncoder();

  let isClosed = false;

  const stream = new ReadableStream({

    start(controller) {

      const unsubscribe = subscribeRealtime((update) => {

        // ✅ DO NOT send if closed
        if (isClosed) return;

        try {

          const message =
            `data: ${JSON.stringify(update)}\n\n`;

          controller.enqueue(
            encoder.encode(message)
          );

        } catch {

          // stream already closed
          isClosed = true;

        }

      });

      // cleanup when connection closes
      return () => {

        isClosed = true;
        unsubscribe();

      };

    }

  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

}
