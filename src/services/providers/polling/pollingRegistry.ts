import { getProviderMode, type ProviderMode } from "@/config/providerMode";

export type PollingHealth = {
  matchId: string;
  providerName: string;
  providerMode: ProviderMode;
  status: "idle" | "active" | "degraded" | "stopped";
  pollIntervalMs: number;
  activeViewers: number;
  lastPollAt?: number;
  lastSuccessAt?: number;
  lastFailureAt?: number;
  providerLatencyMs?: number;
  failedPolls: number;
  retryAttempts: number;
  totalPolls: number;
  pollsLastMinute: number;
  quotaEstimatePerHour: number;
};

const POLL_WINDOW_MS = 60_000;

type InternalHealth = PollingHealth & {
  pollTimestamps: number[];
};

const registry = new Map<string, InternalHealth>();

function pruneWindow(health: InternalHealth, now: number) {
  health.pollTimestamps = health.pollTimestamps.filter((ts) => now - ts <= POLL_WINDOW_MS);
  health.pollsLastMinute = health.pollTimestamps.length;
}


function toPublicHealth(health: InternalHealth): PollingHealth {
  return Object.fromEntries(
    Object.entries(health).filter(([key]) => key !== "pollTimestamps")
  ) as PollingHealth;
}
export function ensurePollingHealth(
  matchId: string,
  providerName: string,
  providerMode: ProviderMode = getProviderMode()
): InternalHealth {
  const existing = registry.get(matchId);
  if (existing) return existing;

  const created: InternalHealth = {
    matchId,
    providerName,
    providerMode,
    status: "idle",
    pollIntervalMs: 30_000,
    activeViewers: 0,
    failedPolls: 0,
    retryAttempts: 0,
    totalPolls: 0,
    pollsLastMinute: 0,
    quotaEstimatePerHour: 0,
    pollTimestamps: [],
  };

  registry.set(matchId, created);
  return created;
}

export function markPollStarted(matchId: string) {
  const health = registry.get(matchId);
  if (!health) return;

  const now = Date.now();
  health.lastPollAt = now;
  health.totalPolls += 1;
  health.status = health.status === "degraded" ? "degraded" : "active";
  health.pollTimestamps.push(now);
  pruneWindow(health, now);
  health.quotaEstimatePerHour = health.pollsLastMinute * 60;
}

export function markPollSuccess(matchId: string, latencyMs: number) {
  const health = registry.get(matchId);
  if (!health) return;

  health.providerLatencyMs = latencyMs;
  health.lastSuccessAt = Date.now();
  health.failedPolls = 0;
  health.retryAttempts = 0;
  if (health.status !== "stopped") {
    health.status = "active";
  }
}

export function markPollFailure(matchId: string) {
  const health = registry.get(matchId);
  if (!health) return;

  health.failedPolls += 1;
  health.retryAttempts += 1;
  health.lastFailureAt = Date.now();
  health.status = "degraded";
}

export function updatePollingContext(
  matchId: string,
  patch: Partial<Pick<PollingHealth, "pollIntervalMs" | "activeViewers" | "status">>
) {
  const health = registry.get(matchId);
  if (!health) return;

  if (patch.pollIntervalMs !== undefined) health.pollIntervalMs = patch.pollIntervalMs;
  if (patch.activeViewers !== undefined) health.activeViewers = patch.activeViewers;
  if (patch.status !== undefined) health.status = patch.status;
}

export function markPollingStopped(matchId: string) {
  const health = registry.get(matchId);
  if (!health) return;
  health.status = "stopped";
}

export function removePollingHealth(matchId: string) {
  registry.delete(matchId);
}

export function getPollingHealth(matchId: string): PollingHealth | null {
  const health = registry.get(matchId);
  if (!health) return null;
  return toPublicHealth(health);
}

export function listPollingHealth(): PollingHealth[] {
  return Array.from(registry.values()).map((health) => toPublicHealth(health));
}

export function getActivePollerCount() {
  let count = 0;
  for (const health of registry.values()) {
    if (health.status === "active" || health.status === "degraded") {
      count += 1;
    }
  }
  return count;
}
