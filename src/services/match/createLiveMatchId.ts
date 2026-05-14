import type { LiveSessionProvider } from "@/types/liveSession";

function sanitizeSegment(value: string): string {
  const cleaned = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, " ")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "team";
}

function createUniquenessSuffix(seed?: number | string): string {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return String(Math.floor(seed));
  }

  if (typeof seed === "string" && seed.trim()) {
    const digits = seed.replace(/\D+/g, "").slice(-8);
    if (digits) return digits;
  }

  return String(Date.now()).slice(-8);
}

export function createLiveMatchSlug(teamA: string, teamB: string): string {
  return `${sanitizeSegment(teamA)}-vs-${sanitizeSegment(teamB)}`;
}

export function createLiveMatchId(input: {
  teamA: string;
  teamB: string;
  provider?: LiveSessionProvider;
  uniqueSeed?: number | string;
}): { matchId: string; slug: string; provider?: LiveSessionProvider } {
  const slug = createLiveMatchSlug(input.teamA, input.teamB);
  const suffix = createUniquenessSuffix(input.uniqueSeed);

  return {
    matchId: `${slug}-${suffix}`,
    slug: `${slug}-${suffix}`,
    provider: input.provider,
  };
}

export function createMatchId(teamA: string, teamB: string): string {
  return createLiveMatchId({ teamA, teamB }).matchId;
}

export function sanitizeMatchName(value: string): string {
  return sanitizeSegment(value);
}
