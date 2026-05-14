import type { MatchState } from "@/services/matchEngine";
import type { SessionSourceType } from "@/types/liveSession";

type CachedSnapshot = {
  matchId: string;
  state: MatchState;
  cachedAt: number;
  sourceType: SessionSourceType;
};

type OutageStat = {
  startedAt: number;
  totalMs: number;
};

const snapshotCache = new Map<string, CachedSnapshot>();
const outageStats = new Map<string, OutageStat>();

let staleFallbackActivations = 0;
let staleDurationMsTotal = 0;

function getSourceMaxAgeMs(sourceType: SessionSourceType): number {
  if (sourceType === "LIVE" || sourceType === "MOCK") {
    return Number(process.env.SNAPSHOT_MAX_AGE_LIVE_MS ?? 90_000);
  }
  if (sourceType === "SIMULATION") {
    return Number(process.env.SNAPSHOT_MAX_AGE_SIMULATION_MS ?? 300_000);
  }
  return Number(process.env.SNAPSHOT_MAX_AGE_REPLAY_MS ?? 86_400_000);
}

export function cacheMatchSnapshot(
  matchId: string,
  state: MatchState,
  sourceType: SessionSourceType = "SIMULATION"
) {
  snapshotCache.set(matchId, {
    matchId,
    state: structuredClone(state),
    cachedAt: Date.now(),
    sourceType,
  });
}

export function getCachedMatchSnapshot(matchId: string): CachedSnapshot | null {
  return snapshotCache.get(matchId) ?? null;
}

export function consumeStaleFallback(matchId: string): CachedSnapshot | null {
  const cached = getCachedMatchSnapshot(matchId);
  if (!cached) return null;

  const now = Date.now();
  const ageMs = now - cached.cachedAt;
  if (ageMs > getSourceMaxAgeMs(cached.sourceType)) {
    return null;
  }

  staleFallbackActivations += 1;
  staleDurationMsTotal += ageMs;
  return cached;
}

export function markProviderOutageStarted(matchId: string) {
  const existing = outageStats.get(matchId);
  if (existing?.startedAt) return;
  outageStats.set(matchId, {
    startedAt: Date.now(),
    totalMs: existing?.totalMs ?? 0,
  });
}

export function markProviderOutageEnded(matchId: string) {
  const stat = outageStats.get(matchId);
  if (!stat?.startedAt) return;
  stat.totalMs += Date.now() - stat.startedAt;
  stat.startedAt = 0;
  outageStats.set(matchId, stat);
}

export function getSnapshotResilienceMetrics() {
  const now = Date.now();
  const outageByMatch = Array.from(outageStats.entries()).map(([matchId, stat]) => ({
    matchId,
    ongoing: stat.startedAt > 0,
    providerOutageDurationMs:
      stat.totalMs + (stat.startedAt > 0 ? Math.max(0, now - stat.startedAt) : 0),
  }));

  return {
    staleFallbackActivations,
    staleDurationMsTotal,
    outageByMatch,
  };
}
