import { NextResponse } from "next/server";

const REQUEST_TIMEOUT_MS = 4500;

export async function GET() {
  const key = process.env.CRICKET_API_KEY;

  if (!key) {
    return NextResponse.json({
      success: false,
      data: [],
      message: "Live fixtures are unavailable right now.",
    });
  }

  const controller = new AbortController();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`,
      { signal: controller.signal, cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        data: [],
        message: "Unable to load live fixtures right now.",
      });
    }

    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    const errorType = err instanceof Error ? err.name : typeof err;
    console.warn(`Live fixtures fetch failed (${errorType})`, err);

    return NextResponse.json(
      {
        success: false,
        data: [],
        message: "Unable to load live fixtures right now.",
      },
      { status: 200 }
    );
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
