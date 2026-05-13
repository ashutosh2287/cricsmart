import { NextResponse } from "next/server";
import { getRedis } from "@/services/storage/redisClient";
import { logger } from "@/lib/logger";

const CACHE_KEY = "live:fixtures:cache";
const CACHE_TTL_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 20000;
const HOURS_IN_MS = 60 * 60 * 1000;
const DAYS_IN_MS = 24 * HOURS_IN_MS;
const RECENT_WINDOW_MS = 48 * HOURS_IN_MS;
const UPCOMING_WINDOW_MS = 7 * DAYS_IN_MS;
const BASE_SCORE_LIVE = 120;
const BASE_SCORE_UPCOMING = 80;
const BASE_SCORE_RECENT = 70;
const BASE_SCORE_OTHER = 30;

type MatchRecord = Record<string, unknown>;
type NormalizedStatus = "LIVE" | "UPCOMING" | "COMPLETED" | "UNKNOWN";
type MatchBucket = "live" | "upcoming" | "recent" | "other";
type SectionKey = "live" | "featured" | "recent" | "upcoming";
const PREMIUM_TOURNAMENT_KEYWORDS = [
  "ipl",
  "indian premier league",
  "icc",
  "world cup",
  "champions trophy",
  "asia cup",
  "india",
  "international",
  "test championship",
  "wtc",
];

type NormalizedMatch = {
  raw: MatchRecord;
  normalizedStatus: NormalizedStatus;
  parsedDateMs?: number;
  dateParseValid: boolean;
};

type ClassifiedMatch = NormalizedMatch & {
  bucket: MatchBucket;
};

type ScoredMatch = ClassifiedMatch & {
  priorityScore: number;
};

type MatchSummary = {
  id: unknown;
  name: unknown;
  status: unknown;
  matchStarted: unknown;
  matchEnded: unknown;
  dateTimeGMT: unknown;
  date: unknown;
};

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

function getProviderMatches(raw: unknown): MatchRecord[] {
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  return Array.isArray(record.data)
    ? record.data.filter((match): match is MatchRecord => typeof match === "object" && match !== null)
    : [];
}

function parseProviderDate(match: MatchRecord): { parsedDateMs?: number; dateParseValid: boolean } {
  const rawDate =
    typeof match.dateTimeGMT === "string"
      ? match.dateTimeGMT
      : typeof match.date === "string"
        ? match.date
        : undefined;

  if (!rawDate) return { dateParseValid: false };
  const parsed = Date.parse(rawDate);
  if (!Number.isFinite(parsed)) return { dateParseValid: false };
  return { parsedDateMs: parsed, dateParseValid: true };
}

function normalizeStatus(match: MatchRecord, parsedDateMs?: number): NormalizedStatus {
  const status = typeof match.status === "string" ? match.status.toLowerCase() : "";
  const started = Boolean(match.matchStarted);
  const ended = Boolean(match.matchEnded);
  const now = Date.now();

  if (ended || status.includes("result") || status.includes("won by") || status.includes("match over")) {
    return "COMPLETED";
  }
  if ((started && !ended) || status.includes("live") || status.includes("innings break")) {
    return "LIVE";
  }
  if (
    status.includes("starts") ||
    status.includes("yet to begin") ||
    status.includes("scheduled") ||
    status.includes("upcoming")
  ) {
    return "UPCOMING";
  }
  if (parsedDateMs !== undefined && parsedDateMs > now) {
    return "UPCOMING";
  }

  return "UNKNOWN";
}

function normalizeMatches(matches: MatchRecord[]): NormalizedMatch[] {
  return matches.map((raw) => {
    const { parsedDateMs, dateParseValid } = parseProviderDate(raw);
    return {
      raw,
      normalizedStatus: normalizeStatus(raw, parsedDateMs),
      parsedDateMs,
      dateParseValid,
    };
  });
}

function classifyMatches(matches: NormalizedMatch[]): ClassifiedMatch[] {
  const now = Date.now();
  return matches.map((match) => {
    if (match.normalizedStatus === "LIVE") {
      return { ...match, bucket: "live" };
    }
    if (match.normalizedStatus === "UPCOMING") {
      return { ...match, bucket: "upcoming" };
    }
    if (
      match.normalizedStatus === "COMPLETED" &&
      match.parsedDateMs !== undefined &&
      now - match.parsedDateMs <= RECENT_WINDOW_MS
    ) {
      return { ...match, bucket: "recent" };
    }
    return { ...match, bucket: "other" };
  });
}

function getPriorityScore(match: ClassifiedMatch): number {
  const base =
    match.bucket === "live"
      ? BASE_SCORE_LIVE
      : match.bucket === "upcoming"
        ? BASE_SCORE_UPCOMING
        : match.bucket === "recent"
          ? BASE_SCORE_RECENT
          : BASE_SCORE_OTHER;
  const category = typeof match.raw.matchCategory === "string" ? match.raw.matchCategory.toUpperCase() : "";
  const categoryBoostMap: Record<string, number> = {
    IPL: 15,
    TEST: 10,
    ODI: 10,
    T20I: 10,
  };
  const categoryBoost = categoryBoostMap[category] ?? 0;

  const now = Date.now();
  let proximityBoost = 0;
  if (match.parsedDateMs !== undefined) {
    if (match.parsedDateMs >= now) {
      proximityBoost = Math.max(0, Math.round((UPCOMING_WINDOW_MS - (match.parsedDateMs - now)) / DAYS_IN_MS));
    } else if (match.bucket === "recent") {
      proximityBoost = Math.max(0, Math.round((RECENT_WINDOW_MS - (now - match.parsedDateMs)) / HOURS_IN_MS));
    }
  }

  return base + categoryBoost + proximityBoost;
}

function scoreMatches(matches: ClassifiedMatch[]): ScoredMatch[] {
  return matches
    .map((match) => ({ ...match, priorityScore: getPriorityScore(match) }))
    .sort((a, b) => b.priorityScore - a.priorityScore);
}

function buildCuratedSections(
  scoredMatches: ScoredMatch[]
): { sections: Record<SectionKey, MatchRecord[]>; removedByFilters: number } {
  const live = scoredMatches.filter((m) => m.bucket === "live");
  const recent = scoredMatches.filter((m) => m.bucket === "recent");
  const upcoming = scoredMatches.filter((m) => m.bucket === "upcoming");
  const featuredPool = selectFeaturedPool(live, recent, upcoming, scoredMatches);
  const featured = featuredPool.slice(0, 6).map((m) => m.raw);
  const recentSection = recent.slice(0, 8).map((m) => m.raw);
  const upcomingSection = upcoming.slice(0, 8).map((m) => m.raw);
  const liveSection = live.slice(0, 12).map((m) => m.raw);

  const anyNonEmpty =
    featured.length > 0 ||
    recentSection.length > 0 ||
    upcomingSection.length > 0 ||
    liveSection.length > 0;
  const nonOtherFallback = scoredMatches.filter((match) => match.bucket !== "other");
  const fallbackPool = nonOtherFallback.length > 0 ? nonOtherFallback : scoredMatches;
  const removedByFilters = scoredMatches.filter((match) => match.bucket === "other").length;

  const safeFeatured = anyNonEmpty ? featured : fallbackPool.slice(0, 6).map((m) => m.raw);

  return {
    sections: {
      live: liveSection,
      featured: safeFeatured,
      recent: recentSection,
      upcoming: upcomingSection,
    },
    removedByFilters,
  };
}

function isPremiumTournamentMatch(match: ScoredMatch): boolean {
  const fields = [
    typeof match.raw.name === "string" ? match.raw.name : "",
    typeof match.raw.seriesName === "string" ? match.raw.seriesName : "",
    typeof match.raw.series === "string" ? match.raw.series : "",
    typeof match.raw.competition === "string" ? match.raw.competition : "",
    typeof match.raw.tournament === "string" ? match.raw.tournament : "",
  ];

  return fields.some((field) => {
    const normalized = field.toLowerCase();
    return PREMIUM_TOURNAMENT_KEYWORDS.some((keyword) => normalized.includes(keyword));
  });
}

function selectFeaturedPool(
  live: ScoredMatch[],
  recent: ScoredMatch[],
  upcoming: ScoredMatch[],
  fallback: ScoredMatch[]
) {
  const premiumLive = live.filter(isPremiumTournamentMatch);
  const premiumUpcoming = upcoming.filter(isPremiumTournamentMatch);
  const premiumRecent = recent.filter(isPremiumTournamentMatch);
  const prioritizedPremiumPool = [...premiumLive, ...premiumUpcoming, ...premiumRecent];
  if (prioritizedPremiumPool.length > 0) return prioritizedPremiumPool;

  const premiumFallbackPool = fallback.filter(isPremiumTournamentMatch);
  if (premiumFallbackPool.length > 0) return premiumFallbackPool;

  if (upcoming.length > 0) return upcoming;
  if (recent.length > 0) return recent;
  if (live.length > 0) return live;
  return fallback;
}

function summarizeMatches(matches: MatchRecord[]): MatchSummary[] {
  return matches.slice(0, 5).map((match) => ({
    id: match.id,
    name: match.name,
    status: match.status,
    matchStarted: match.matchStarted,
    matchEnded: match.matchEnded,
    dateTimeGMT: match.dateTimeGMT,
    date: match.date,
  }));
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof Error && err.name === "AbortError") ||
    (typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name?: unknown }).name === "AbortError")
  );
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
    const providerMatches = getProviderMatches(raw);
    const enrichedMatches = getProviderMatches(data);
    const normalizedMatches = normalizeMatches(enrichedMatches);
    const classifiedMatches = classifyMatches(normalizedMatches);
    const scoredMatches = scoreMatches(classifiedMatches);
    const { sections, removedByFilters } = buildCuratedSections(scoredMatches);

    logger.debug("MATCH_CURATION", "Raw provider payload", {
      totalProviderMatches: providerMatches.length,
      sample: summarizeMatches(providerMatches),
    });
    logger.debug("MATCH_CURATION", "Normalized matches output", {
      totalNormalizedMatches: normalizedMatches.length,
      statusCounts: normalizedMatches.reduce<Record<NormalizedStatus, number>>(
        (acc, match) => {
          acc[match.normalizedStatus] += 1;
          return acc;
        },
        { LIVE: 0, UPCOMING: 0, COMPLETED: 0, UNKNOWN: 0 }
      ),
      invalidDateCount: normalizedMatches.filter((match) => !match.dateParseValid).length,
    });
    logger.debug("MATCH_CURATION", "Classified matches output", {
      totalClassifiedMatches: classifiedMatches.length,
      bucketCounts: classifiedMatches.reduce<Record<MatchBucket, number>>(
        (acc, match) => {
          acc[match.bucket] += 1;
          return acc;
        },
        { live: 0, upcoming: 0, recent: 0, other: 0 }
      ),
    });
    logger.debug("MATCH_CURATION", "Priority-scored matches output", {
      totalPriorityScoredMatches: scoredMatches.length,
      topScored: scoredMatches.slice(0, 5).map((match) => ({
        id: match.raw.id,
        name: match.raw.name,
        normalizedStatus: match.normalizedStatus,
        bucket: match.bucket,
        priorityScore: match.priorityScore,
      })),
    });
    logger.debug("MATCH_CURATION", "Final section-builder output", {
      totalMatchesRemovedByFilters: removedByFilters,
      curatedSectionKeys: Object.keys(sections),
      sectionCounts: {
        live: sections.live.length,
        featured: sections.featured.length,
        recent: sections.recent.length,
        upcoming: sections.upcoming.length,
      },
      allSectionsEmpty:
        sections.live.length === 0 &&
        sections.featured.length === 0 &&
        sections.recent.length === 0 &&
        sections.upcoming.length === 0,
    });

    const responsePayload =
      data && typeof data === "object"
        ? {
            ...(data as Record<string, unknown>),
            sections,
            curatedSections: sections,
          }
        : data;

    // 4. Store in cache
    if (redis) {
      try {
        await redis.set(CACHE_KEY, JSON.stringify(responsePayload), "EX", CACHE_TTL_SECONDS);
      } catch (cacheSetErr) {
        console.warn("Redis set failed", cacheSetErr);
      }
    }

    return NextResponse.json(responsePayload);
  } catch (err) {
    if (isAbortError(err)) {
      console.warn(`Live fixtures fetch timed out after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      const errorType = err instanceof Error ? err.name : typeof err;
      console.warn(`Live fixtures fetch failed (${errorType})`, err);
    }

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
