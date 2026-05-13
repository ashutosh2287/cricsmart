import { compareCuratedMatches } from "./matchPriority";
import { CuratedMatch, MatchSections } from "./types";

const LIVE_LIMIT = 10;
const UPCOMING_LIMIT = 10;
const RECENT_LIMIT = 10;
const FEATURED_LIMIT = 8;
const UPCOMING_WINDOW_MS = 24 * 60 * 60 * 1000;

function dedupe(matches: CuratedMatch[]): CuratedMatch[] {
  const map = new Map<string, CuratedMatch>();
  for (const match of matches) {
    const previous = map.get(match.id);
    if (!previous || match.priorityScore > previous.priorityScore) {
      map.set(match.id, match);
    }
  }
  return [...map.values()];
}

function sortMatches(matches: CuratedMatch[]): CuratedMatch[] {
  return [...matches].sort(compareCuratedMatches);
}

function takeUnique(pool: CuratedMatch[], seen: Set<string>, limit: number): CuratedMatch[] {
  const picked: CuratedMatch[] = [];
  for (const match of pool) {
    if (seen.has(match.id)) continue;
    seen.add(match.id);
    picked.push(match);
    if (picked.length >= limit) break;
  }
  return picked;
}

export function buildMatchSections(matches: CuratedMatch[]): MatchSections {
  const all = sortMatches(dedupe(matches));
  const now = Date.now();

  const livePool = all.filter((match) => match.status === "live");
  const featuredPool = all.filter((match) => match.isFeatured || match.isIPL || match.isICC || match.isIndiaMatch);
  const upcomingPool = all.filter((match) => {
    if (match.status !== "upcoming") return false;
    const start = new Date(match.startTime).getTime();
    if (!Number.isFinite(start) || start <= 0) return true;
    return start >= now && start - now <= UPCOMING_WINDOW_MS;
  });
  const recentPool = all.filter((match) => match.status === "completed");

  const used = new Set<string>();

  const live = takeUnique(livePool, used, LIVE_LIMIT);
  const featured = takeUnique(featuredPool, used, FEATURED_LIMIT);
  const upcoming = takeUnique(upcomingPool, used, UPCOMING_LIMIT);
  const recent = takeUnique(recentPool, used, RECENT_LIMIT);

  const fallbackPool = all.filter((match) => !used.has(match.id));

  if (featured.length === 0) {
    featured.push(...takeUnique(fallbackPool, used, Math.min(FEATURED_LIMIT, 4)));
  }

  if (upcoming.length === 0) {
    upcoming.push(...takeUnique(all.filter((m) => m.status !== "completed"), used, Math.min(UPCOMING_LIMIT, 4)));
  }

  if (recent.length === 0) {
    recent.push(...takeUnique(all.filter((m) => m.status !== "live"), used, Math.min(RECENT_LIMIT, 4)));
  }

  return {
    live,
    upcoming,
    recent,
    featured,
  };
}
