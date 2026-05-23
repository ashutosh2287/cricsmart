import { NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { logger } from "@/lib/logger";
import { curateDiscovery } from "@/services/matches/curateMatches";
import { CuratedDiscoveryPayload, CuratedMatch, MatchSections, ProviderMatch } from "@/services/matches/types";
import { getProviderMode } from "@/config/providerMode";
import { getMatchProvider } from "@/services/providers/providerFactory";

const CACHE_KEY = "live:fixtures:cache";
const CACHE_TTL_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 8000;
const API_BASE = "https://api.cricapi.com/v1";
const PAGE_1_ENDPOINT = "/currentMatches?offset=0";
const PAGE_2_ENDPOINT = "/currentMatches?offset=25";
const STATUS_COMPLETED_REGEX = /(won|loss|tied|draw|result|abandon|stumps|match over)/i;
const STATUS_LIVE_REGEX = /(live|innings|in progress|session|day\s*[1-5]|break|chasing|trail|need|required|target)/i;
const STATUS_UPCOMING_REGEX = /(starts|yet to begin|scheduled|upcoming|toss)/i;

type ProviderEndpointResult = {
  endpoint: string;
  httpStatus?: number;
  ok: boolean;
  count: number;
  message?: string;
  payload?: unknown;
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function emptySections(): MatchSections {
  return {
    live: [],
    upcoming: [],
    recent: [],
    featured: [],
  };
}

function buildEmptyPayload(error: string, source: "live" | "cache" | "stale" = "live", stale = false): CuratedDiscoveryPayload {
  return {
    success: false,
    source,
    stale,
    updatedAt: new Date().toISOString(),
    data: [],
    sections: emptySections(),
    error,
  };
}

function isCuratedMatchArray(value: unknown): value is CuratedMatch[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => typeof item === "object" && item !== null && "id" in item);
}

function normalizeCachedPayload(raw: unknown): CuratedDiscoveryPayload | null {
  const record = asObject(raw);

  const data = record.data;
  const sections = asObject(record.sections);

  if (!isCuratedMatchArray(data)) return null;
  if (!isCuratedMatchArray(sections.live)) return null;
  if (!isCuratedMatchArray(sections.upcoming)) return null;
  if (!isCuratedMatchArray(sections.recent)) return null;
  if (!isCuratedMatchArray(sections.featured)) return null;

  const source = record.source === "cache" || record.source === "stale" ? record.source : "cache";

  return {
    success: Boolean(record.success),
    source,
    stale: Boolean(record.stale),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
    data,
    sections: {
      live: sections.live as CuratedMatch[],
      upcoming: sections.upcoming as CuratedMatch[],
      recent: sections.recent as CuratedMatch[],
      featured: sections.featured as CuratedMatch[],
    },
    error: typeof record.error === "string" ? record.error : undefined,
  };
}

function getProviderMatches(payload: unknown): ProviderMatch[] {
  return asArray<ProviderMatch>(asObject(payload).data).filter(
    (row) => typeof row === "object" && row !== null
  );
}

function dedupeProviderMatches(matches: ProviderMatch[]): { deduped: ProviderMatch[]; dedupeRemoved: number } {
  const map = new Map<string, ProviderMatch>();

  for (const match of matches) {
    const id = typeof match.id === "string" || typeof match.id === "number" ? String(match.id) : "";
    const name = typeof match.name === "string" ? match.name : "";
    const date = typeof match.dateTimeGMT === "string" ? match.dateTimeGMT : typeof match.date === "string" ? match.date : "";
    const key = id || `${name}\u001F${date}`;
    if (!key) continue;
    if (!map.has(key)) map.set(key, match);
  }

  const deduped = [...map.values()];
  return {
    deduped,
    dedupeRemoved: Math.max(0, matches.length - deduped.length),
  };
}

function classifyStatusSignal(match: ProviderMatch): "live" | "upcoming" | "completed" | "unsupported" {
  const status = typeof match.status === "string" ? match.status.toLowerCase() : "";
  const started = match.matchStarted === true;
  const ended = match.matchEnded === true;

  if (ended || STATUS_COMPLETED_REGEX.test(status)) return "completed";
  if (started || STATUS_LIVE_REGEX.test(status)) return "live";
  if (STATUS_UPCOMING_REGEX.test(status)) return "upcoming";

  const rawDate = typeof match.dateTimeGMT === "string" ? match.dateTimeGMT : typeof match.date === "string" ? match.date : "";
  const ts = rawDate ? Date.parse(rawDate) : Number.NaN;
  if (Number.isFinite(ts) && ts > Date.now()) return "upcoming";

  return "unsupported";
}

function buildExclusionSummary(matches: ProviderMatch[], dedupeRemoved: number) {
  let invalidDateCount = 0;
  let unsupportedStatusCount = 0;

  for (const match of matches) {
    const rawDate = typeof match.dateTimeGMT === "string" ? match.dateTimeGMT : typeof match.date === "string" ? match.date : "";
    if (!rawDate || !Number.isFinite(Date.parse(rawDate))) invalidDateCount += 1;
    if (classifyStatusSignal(match) === "unsupported") unsupportedStatusCount += 1;
  }

  return {
    invalidDateCount,
    unsupportedStatusCount,
    dedupeRemoved,
  };
}

function summarizeCurated(curated: { data: CuratedMatch[]; sections: MatchSections }) {
  return {
    totalCuratedMatches: curated.data.length,
    statusCounts: curated.data.reduce<Record<"live" | "upcoming" | "completed", number>>(
      (acc, match) => {
        acc[match.status] += 1;
        return acc;
      },
      { live: 0, upcoming: 0, completed: 0 }
    ),
    sectionCounts: {
      live: curated.sections.live.length,
      upcoming: curated.sections.upcoming.length,
      recent: curated.sections.recent.length,
      featured: curated.sections.featured.length,
    },
  };
}

async function fetchProviderEndpoint(endpoint: string, key: string, signal: AbortSignal): Promise<ProviderEndpointResult> {
  if (!endpoint.startsWith("/") || /\s/.test(endpoint)) {
    return {
      endpoint,
      ok: false,
      count: 0,
      message: "invalid_endpoint",
    };
  }

  const separator = endpoint.includes("?") ? "&" : "?";
  const url = `${API_BASE}${endpoint}${separator}apikey=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { signal, cache: "no-store" });
    const httpStatus = res.status;

    if (!res.ok) {
      return {
        endpoint,
        httpStatus,
        ok: false,
        count: 0,
        message: `http_${httpStatus}`,
      };
    }

    const payload = await res.json();
    const count = getProviderMatches(payload).length;

    return {
      endpoint,
      httpStatus,
      ok: true,
      count,
      message: typeof asObject(payload).status === "string" ? String(asObject(payload).status) : undefined,
      payload,
    };
  } catch (err) {
    return {
      endpoint,
      ok: false,
      count: 0,
      message: err instanceof Error ? err.name : "fetch_error",
    };
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === "AbortError";
}

export async function GET() {
  const mode = getProviderMode();
  const provider = getMatchProvider(mode);
  const key = process.env.CRICKET_API_KEY;

  let redis;
  try {
    redis = getRedis();
  } catch {
    logger.warn("MATCH_CURATION", "Redis unavailable for live fixtures route");
  }

  let cachedPayload: CuratedDiscoveryPayload | null = null;
  if (redis) {
    try {
      const cachedRaw = await redis.get(CACHE_KEY);
      if (cachedRaw) {
        cachedPayload = normalizeCachedPayload(JSON.parse(cachedRaw));
        if (cachedPayload) {
          return NextResponse.json({ ...cachedPayload, source: "cache", stale: false });
        }
      }
    } catch (cacheErr) {
      logger.warn("MATCH_CURATION", "Redis cache read failed", {
        error: cacheErr instanceof Error ? cacheErr.message : String(cacheErr),
      });
    }
  }

  if (mode === "cricketdata" && !key) {
    logger.warn("MATCH_CURATION", "Missing server-side CRICKET_API_KEY in live fixtures route");
    if (cachedPayload) {
      return NextResponse.json({ ...cachedPayload, source: "stale", stale: true, error: "missing_api_key" });
    }
    return NextResponse.json(buildEmptyPayload("unavailable", "live"));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let deduped: ProviderMatch[] = [];

    if (mode !== "cricketdata") {
      const providerMatches = await provider.getFixtures(controller.signal);
      deduped = dedupeProviderMatches(providerMatches).deduped;
      logger.info("PROVIDER", "provider_poll_success", {
        providerMode: mode,
        provider: provider.name,
        fixtures: deduped.length,
      });
    } else {
      const providerKey = key;
      if (!providerKey) {
        throw new Error("Missing server-side CRICKET_API_KEY for cricketdata provider");
      }

      const [page1, page2] = await Promise.all([
        fetchProviderEndpoint(PAGE_1_ENDPOINT, providerKey, controller.signal),
        fetchProviderEndpoint(PAGE_2_ENDPOINT, providerKey, controller.signal),
      ]);
      const endpointResults: ProviderEndpointResult[] = [page1, page2];

      const mergedMatches: ProviderMatch[] = [];
      if (page1.ok && page1.payload) {
        mergedMatches.push(...getProviderMatches(page1.payload));
      }
      if (page2.ok && page2.payload) {
        mergedMatches.push(...getProviderMatches(page2.payload));
      }

      const { deduped: d, dedupeRemoved } = dedupeProviderMatches(mergedMatches);
      deduped = d;

      logger.debug("MATCH_CURATION", "Provider endpoint responses", {
        endpoints: endpointResults.map((item) => ({
          endpoint: item.endpoint,
          ok: item.ok,
          httpStatus: item.httpStatus,
          returnedMatches: item.count,
          message: item.message,
        })),
      });

      logger.debug("MATCH_CURATION", "Provider merge summary", {
        totalRawProviderMatches: mergedMatches.length,
        totalAfterDedupe: deduped.length,
        ...buildExclusionSummary(deduped, dedupeRemoved),
      });
    }

    if (deduped.length === 0) {
      if (cachedPayload) {
        return NextResponse.json({ ...cachedPayload, source: "stale", stale: true, error: "provider_empty" });
      }
      return NextResponse.json(buildEmptyPayload("provider_empty", "live"));
    }

    const providerPayload = { data: deduped };
    const curated = curateDiscovery(providerPayload, provider.name);

    const responsePayload: CuratedDiscoveryPayload = {
      success: curated.data.length > 0,
      source: "live",
      updatedAt: new Date().toISOString(),
      data: curated.data,
      sections: curated.sections,
      error: curated.data.length > 0 ? undefined : "provider_empty",
    };

    logger.debug("MATCH_CURATION", "Curated discovery output", {
      ...summarizeCurated(curated),
      excludedByCuration: Math.max(0, deduped.length - curated.data.length),
      sample: curated.data.slice(0, 5).map((match) => ({
        id: match.id,
        title: match.title,
        status: match.status,
        seriesName: match.seriesName,
        priorityScore: match.priorityScore,
      })),
      providerMode: mode,
      providerName: provider.name,
    });

    if (redis) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(responsePayload), "EX", CACHE_TTL_SECONDS);
      } catch (cacheSetErr) {
        logger.warn("MATCH_CURATION", "Redis cache write failed", {
          error: cacheSetErr instanceof Error ? cacheSetErr.message : String(cacheSetErr),
        });
      }
    }

    return NextResponse.json(responsePayload);
  } catch (err) {
    if (isAbortError(err)) {
      logger.warn("MATCH_CURATION", `Live fixtures fetch timed out after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      logger.warn("MATCH_CURATION", "Live fixtures fetch failed", {
        errorType: err instanceof Error ? err.name : typeof err,
      });
    }

    if (cachedPayload) {
      return NextResponse.json({ ...cachedPayload, source: "stale", stale: true, error: "unavailable" });
    }

    return NextResponse.json(buildEmptyPayload("unavailable", "live"));
  } finally {
    clearTimeout(timeout);
  }
}