import { NextResponse } from "next/server";

export async function GET() {

  let interval: NodeJS.Timeout;

  const stream = new ReadableStream({

    start(controller) {

      const encoder = new TextEncoder();

      interval = setInterval(() => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ ping: true })}\n\n`)
        );
      }, 5000);

    },

    cancel() {
      clearInterval(interval);
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