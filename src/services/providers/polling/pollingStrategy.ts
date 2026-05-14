import { type ProviderMode } from "@/config/providerMode";
import {
  getMatchPriorityScore,
  toPriorityBand,
  type PriorityBand,
} from "@/services/providers/polling/pollingPriority";

export type PollingContext = {
  matchId: string;
  providerMode: ProviderMode;
  activeViewers: number;
  matchCompleted: boolean;
  isDeathOvers: boolean;
  isFixturesPage: boolean;
  failedPolls: number;
  pollsLastMinute: number;
  teamA?: string;
  teamB?: string;
  seriesName?: string;
  format?: string;
};

export type PollingDangerLevel = "normal" | "warning" | "critical";

const MAX_POLLS_PER_MINUTE = Number(process.env.POLLING_MAX_POLLS_PER_MINUTE ?? 24);
const MAX_RETRY_ATTEMPTS = Number(process.env.POLLING_MAX_RETRY_ATTEMPTS ?? 6);
const MAX_CONCURRENT_LIVE_SESSIONS = Number(
  process.env.POLLING_MAX_CONCURRENT_LIVE_SESSIONS ?? 20
);
const SAFE_DAILY_BUDGET = Number(process.env.POLLING_SAFE_DAILY_BUDGET ?? 20000);
const DANGER_DAILY_BUDGET = Number(process.env.POLLING_DANGER_DAILY_BUDGET ?? 26000);

export function getPollingLimits() {
  return {
    maxPollsPerMinute: MAX_POLLS_PER_MINUTE,
    maxRetryAttempts: MAX_RETRY_ATTEMPTS,
    maxConcurrentLiveSessions: MAX_CONCURRENT_LIVE_SESSIONS,
    safeDailyBudget: SAFE_DAILY_BUDGET,
    dangerDailyBudget: DANGER_DAILY_BUDGET,
  };
}

export function shouldStopPolling(ctx: PollingContext): boolean {
  if (ctx.matchCompleted) return true;
  return false;
}

export function shouldDegradePolling(ctx: PollingContext): boolean {
  if (ctx.failedPolls >= MAX_RETRY_ATTEMPTS) return true;
  if (ctx.pollsLastMinute >= MAX_POLLS_PER_MINUTE) return true;
  if (getQuotaDangerLevel(ctx) === "critical") return true;
  return false;
}

function getBaseIntervalMs(ctx: PollingContext): number {
  if (ctx.providerMode === "mock") return 1000;
  if (ctx.providerMode === "simulation") return 60_000;

  if (ctx.matchCompleted) return 300_000;
  if (ctx.activeViewers <= 0) return 180_000;
  if (ctx.isFixturesPage) return 60_000;
  if (ctx.isDeathOvers) return 8000;
  return 20_000;
}

export function getProjectedRequestsPerDay(ctx: PollingContext): number {
  const projectedByMinute = Math.max(ctx.pollsLastMinute, 1);
  return projectedByMinute * 60 * 24;
}

export function getQuotaDangerLevel(ctx: PollingContext): PollingDangerLevel {
  const projected = getProjectedRequestsPerDay(ctx);
  if (projected >= DANGER_DAILY_BUDGET) return "critical";
  if (projected >= SAFE_DAILY_BUDGET) return "warning";
  return "normal";
}

export function getPriorityBand(ctx: PollingContext): PriorityBand {
  return toPriorityBand(
    getMatchPriorityScore({
      teamA: ctx.teamA,
      teamB: ctx.teamB,
      seriesName: ctx.seriesName,
      format: ctx.format,
    })
  );
}

export function getRetryBudget(ctx: PollingContext): number {
  const band = getPriorityBand(ctx);
  const danger = getQuotaDangerLevel(ctx);
  if (band === "highest") return danger === "critical" ? 8 : 10;
  if (band === "medium") return danger === "critical" ? 4 : 6;
  return danger === "critical" ? 2 : 4;
}

export function resolvePollingIntervalMs(ctx: PollingContext): number {
  const base = getBaseIntervalMs(ctx);
  const band = getPriorityBand(ctx);
  const danger = getQuotaDangerLevel(ctx);

  let interval = base;

  if (band === "highest") interval = Math.max(4000, Math.floor(interval * 0.75));
  if (band === "low") interval = Math.floor(interval * 1.35);
  if (danger === "warning") interval = Math.floor(interval * 1.2);
  if (danger === "critical" && band !== "highest") interval = Math.floor(interval * 1.7);

  return interval;
}
