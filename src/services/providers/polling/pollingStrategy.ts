import { type ProviderMode } from "@/config/providerMode";

export type PollingContext = {
  providerMode: ProviderMode;
  activeViewers: number;
  matchCompleted: boolean;
  isDeathOvers: boolean;
  isFixturesPage: boolean;
  failedPolls: number;
  pollsLastMinute: number;
};

const MAX_POLLS_PER_MINUTE = Number(process.env.POLLING_MAX_POLLS_PER_MINUTE ?? 24);
const MAX_RETRY_ATTEMPTS = Number(process.env.POLLING_MAX_RETRY_ATTEMPTS ?? 6);
const MAX_CONCURRENT_LIVE_SESSIONS = Number(
  process.env.POLLING_MAX_CONCURRENT_LIVE_SESSIONS ?? 20
);

export function getPollingLimits() {
  return {
    maxPollsPerMinute: MAX_POLLS_PER_MINUTE,
    maxRetryAttempts: MAX_RETRY_ATTEMPTS,
    maxConcurrentLiveSessions: MAX_CONCURRENT_LIVE_SESSIONS,
  };
}

export function shouldStopPolling(ctx: PollingContext): boolean {
  if (ctx.matchCompleted) return true;
  return false;
}

export function shouldDegradePolling(ctx: PollingContext): boolean {
  if (ctx.failedPolls >= MAX_RETRY_ATTEMPTS) return true;
  if (ctx.pollsLastMinute >= MAX_POLLS_PER_MINUTE) return true;
  return false;
}

export function resolvePollingIntervalMs(ctx: PollingContext): number {
  if (ctx.providerMode === "mock") return 1000;
  if (ctx.providerMode === "simulation") return 60_000;


  if (ctx.matchCompleted) return 300_000;
  if (ctx.activeViewers <= 0) return 180_000;
  if (ctx.isFixturesPage) return 60_000;
  if (ctx.isDeathOvers) return 8000;
  return 20_000;
}
