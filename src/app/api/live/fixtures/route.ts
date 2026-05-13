import { NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { curateDiscovery } from "@/services/matches/curateMatches";
import { CuratedDiscoveryPayload } from "@/services/matches/types";

const CACHE_KEY = "live:fixtures:cache:curated:v1";
const CACHE_TTL_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 20000;

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof Error && err.name === "AbortError") ||
    (typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name?: unknown }).name === "AbortError")
  );
}

function emptyPayload(overrides: Partial<CuratedDiscoveryPayload> = {}): CuratedDiscoveryPayload {
  return {
    success: false,
    source: "live",
    updatedAt: new Date().toISOString(),
    data: [],
    sections: {
      live: [],
      upcoming: [],
      recent: [],
      featured: [],
    },
    ...overrides,
  };
}

function parseCached(value: string): CuratedDiscoveryPayload | null {
  try {
    const parsed = JSON.parse(value) as CuratedDiscoveryPayload;
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.data)) return null;
    if (!parsed.sections || typeof parsed.sections !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET() {
  const key = process.env.CRICKET_API_KEY;

  let redis: ReturnType<typeof getRedis> | undefined;
  try {
    redis = getRedis();
  } catch {
    // Redis unavailable — fall through to live fetch
  }

  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const parsed = parseCached(cached);
        if (parsed) {
          return NextResponse.json({ ...parsed, source: "cache" as const });
        }
      }
    } catch (cacheErr) {
      console.warn("Redis get failed", cacheErr);
    }
  }

  if (!key) {
    return NextResponse.json(emptyPayload({ error: "unavailable" }));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      if (redis) {
        try {
          const stale = await redis.get(CACHE_KEY);
          if (stale) {
            const parsed = parseCached(stale);
            if (parsed) {
              return NextResponse.json({ ...parsed, stale: true, source: "stale" as const });
            }
          }
        } catch {
          // ignore
        }
      }
      return NextResponse.json(emptyPayload({ error: "unavailable" }));
    }

    const raw = await res.json();
    const curated = curateDiscovery(raw, "cricapi");

    const payload: CuratedDiscoveryPayload = {
      success: true,
      source: "live",
      updatedAt: new Date().toISOString(),
      data: curated.data,
      sections: curated.sections,
    };

    if (redis) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(payload), "EX", CACHE_TTL_SECONDS);
      } catch (cacheSetErr) {
        console.warn("Redis set failed", cacheSetErr);
      }
    }

    return NextResponse.json(payload);
  } catch (err) {
    if (isAbortError(err)) {
      console.warn(`Live fixtures fetch timed out after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      const errorType = err instanceof Error ? err.name : typeof err;
      console.warn(`Live fixtures fetch failed (${errorType})`, err);
    }

    if (redis) {
      try {
        const stale = await redis.get(CACHE_KEY);
        if (stale) {
          const parsed = parseCached(stale);
          if (parsed) {
            return NextResponse.json({ ...parsed, stale: true, source: "stale" as const });
          }
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json(emptyPayload({ error: "unavailable" }));
  } finally {
    clearTimeout(timeout);
  }
}
