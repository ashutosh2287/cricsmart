import { NextResponse } from "next/server";
import { requireRouteAccess } from "@/services/auth/routeGuard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUEST_TIMEOUT_MS = 10_000;

type MatchRecord = Record<string, unknown>;

function getProviderMatches(raw: unknown): MatchRecord[] {
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  return Array.isArray(record.data)
    ? record.data.filter((match): match is MatchRecord => typeof match === "object" && match !== null)
    : [];
}

function maskKey(value: string): string {
  if (value.length <= 4) return "***";
  return `${value.slice(0, 2)}***${value.slice(-2)}`;
}

function summarizeStatus(matches: MatchRecord[]) {
  return matches.reduce<{
    live: number;
    upcoming: number;
    completed: number;
    unknown: number;
  }>(
    (acc, match) => {
      const started = Boolean(match.matchStarted);
      const ended = Boolean(match.matchEnded);

      if (started && !ended) {
        acc.live += 1;
      } else if (!started && !ended) {
        acc.upcoming += 1;
      } else if (ended) {
        acc.completed += 1;
      } else {
        acc.unknown += 1;
      }

      return acc;
    },
    { live: 0, upcoming: 0, completed: 0, unknown: 0 }
  );
}

export async function GET(req: Request) {
  const access = await requireRouteAccess({ req, scope: "internal" });
  if (!access.ok) return access.response;

  const apiKey = process.env.CRICKET_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        cricketApiKey: {
          configured: false,
        },
        provider: {
          endpoint: "/v1/currentMatches",
          ok: false,
          totalMatches: 0,
          counts: { live: 0, upcoming: 0, completed: 0, unknown: 0 },
          error: "Missing CRICKET_API_KEY",
        },
      },
      { status: 500 }
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `https://api.cricapi.com/v1/currentMatches?apikey=${encodeURIComponent(apiKey)}&offset=0`;
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          timestamp: new Date().toISOString(),
          cricketApiKey: {
            configured: true,
            masked: maskKey(apiKey),
          },
          provider: {
            endpoint: "/v1/currentMatches",
            ok: false,
            status: res.status,
            totalMatches: 0,
            counts: { live: 0, upcoming: 0, completed: 0, unknown: 0 },
            error: `Provider returned ${res.status}`,
          },
        },
        { status: 502 }
      );
    }

    const raw = await res.json();
    const matches = getProviderMatches(raw);
    const counts = summarizeStatus(matches);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      cricketApiKey: {
        configured: true,
        masked: maskKey(apiKey),
      },
      provider: {
        endpoint: "/v1/currentMatches",
        ok: true,
        status: res.status,
        totalMatches: matches.length,
        counts,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.name === "AbortError"
        ? `Provider timeout after ${REQUEST_TIMEOUT_MS}ms`
        : error instanceof Error
          ? error.message
          : "Provider request failed";

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        cricketApiKey: {
          configured: true,
          masked: maskKey(apiKey),
        },
        provider: {
          endpoint: "/v1/currentMatches",
          ok: false,
          totalMatches: 0,
          counts: { live: 0, upcoming: 0, completed: 0, unknown: 0 },
          error: errorMessage,
        },
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
