import { NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";

const CACHE_KEY = "live:fixtures:cache";
const CACHE_TTL_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 8000;

function categorizeMatch(match: Record<string, unknown>): string {
  const name = (typeof match.name === "string" ? match.name : "").toLowerCase();
  const type = (typeof match.matchType === "string" ? match.matchType : "").toLowerCase();

  if (name.includes("ipl") || name.includes("indian premier league")) return "IPL";
  if (type === "test" || name.includes("test match")) return "TEST";
  if (type === "odi" || name.includes("one day")) return "ODI";
  if (type === "t20i" || name.includes("t20i") || name.includes("twenty20 international")) return "T20I";
  if (
    name.includes("county") ||
    name.includes("ranji") ||
    name.includes("sheffield shield") ||
    name.includes("duleep")
  )
    return "DOMESTIC";
  return "T20";
}

function enrichMatches(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.data)) return data;

  const enriched = record.data.map((match: unknown) => {
    if (!match || typeof match !== "object") return match;
    const m = match as Record<string, unknown>;
    return {
      ...m,
      matchCategory: categorizeMatch(m),
      isLive: Boolean(m.matchStarted) && !Boolean(m.matchEnded),
      isCompleted: Boolean(m.matchEnded),
    };
  });

  return { ...record, data: enriched };
}

export async function GET() {
  const key = process.env.CRICKET_API_KEY;

  let redis;
  try {
    redis = getRedis();
  } catch {
    // Redis unavailable — fall through to live fetch
  }

  // 1. Try cache first
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        return NextResponse.json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.warn("Redis get failed", cacheErr);
    }
  }

  // 2. If no API key, return empty
  if (!key) {
    return NextResponse.json({ success: false, matches: [], error: "unavailable" });
  }

  // 3. Fetch from cricapi with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`,
      { signal: controller.signal, cache: "no-store" }
    );

    if (!res.ok) {
      // API error — return stale cache if available, else empty
      if (redis) {
        try {
          const stale = await redis.get(CACHE_KEY);
          if (stale) {
            return NextResponse.json({ ...JSON.parse(stale), stale: true });
          }
        } catch {
          // ignore
        }
      }
      return NextResponse.json({ success: false, matches: [], error: "unavailable" });
    }

    const raw = await res.json();
    const data = enrichMatches(raw);

    // 4. Store in cache
    if (redis) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(data), "EX", CACHE_TTL_SECONDS);
      } catch (cacheSetErr) {
        console.warn("Redis set failed", cacheSetErr);
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    const errorType = err instanceof Error ? err.name : typeof err;
    console.warn(`Live fixtures fetch failed (${errorType})`, err);

    // 5. On failure: return stale cache with stale flag, or empty
    if (redis) {
      try {
        const stale = await redis.get(CACHE_KEY);
        if (stale) {
          return NextResponse.json({ ...JSON.parse(stale), stale: true });
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ success: false, matches: [], error: "unavailable" });
  } finally {
    clearTimeout(timeout);
  }
}