import { logger } from "@/lib/logger";
import {
  ensurePollingHealth,
  getActivePollerCount,
  getPollingHealth,
  markPollFailure,
  markPollStarted,
  markPollSuccess,
  markPollingStopped,
  removePollingHealth,
  updatePollingContext,
} from "@/services/providers/polling/pollingRegistry";
import {
  getPollingLimits,
  getPriorityBand,
  getProjectedRequestsPerDay,
  getQuotaDangerLevel,
  getRetryBudget,
  resolvePollingIntervalMs,
  shouldDegradePolling,
  shouldStopPolling,
  type PollingContext,
} from "@/services/providers/polling/pollingStrategy";
import type { ProviderMode } from "@/config/providerMode";
import { getMatchPriorityScore } from "@/services/providers/polling/pollingPriority";

type PollingSessionConfig = {
  matchId: string;
  providerName: string;
  providerMode: ProviderMode;
  getContext: () => PollingContext;
  poll: () => Promise<void>;
  onStop?: () => void;
};

type PollingSession = {
  timer: ReturnType<typeof setTimeout> | null;
  running: boolean;
};

const sessions = new Map<string, PollingSession>();
const MIN_JITTER_MS = 2000;
const MAX_JITTER_MS = 5000;
const MIN_JITTER_FLOOR_MS = 500;
const MAX_JITTER_FACTOR = 0.5;

function applyJitter(delayMs: number): number {
  const baseSpan = MIN_JITTER_MS + Math.random() * (MAX_JITTER_MS - MIN_JITTER_MS);
  const span = Math.min(
    baseSpan,
    Math.max(MIN_JITTER_FLOOR_MS, Math.floor(delayMs * MAX_JITTER_FACTOR))
  );
  const signed = Math.random() < 0.5 ? -span : span;
  return Math.max(1000, Math.round(delayMs + signed));
}

function scheduleNext(matchId: string, delayMs: number, run: () => Promise<void>) {
  const session = sessions.get(matchId);
  if (!session || !session.running) return;

  if (session.timer) {
    clearTimeout(session.timer);
  }

  session.timer = setTimeout(() => {
    run().catch((err) => {
      markPollFailure(matchId);
      logger.error("PROVIDER", "provider_poll_failed", {
        matchId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }, delayMs);
}

export function startPollingSession(config: PollingSessionConfig) {
  const existing = sessions.get(config.matchId);
  if (existing?.running) {
    return;
  }

  const session: PollingSession = {
    timer: null,
    running: true,
  };

  sessions.set(config.matchId, session);
  ensurePollingHealth(config.matchId, config.providerName, config.providerMode);

  const execute = async () => {
    const current = sessions.get(config.matchId);
    if (!current?.running) return;

    const context = config.getContext();
    const limits = getPollingLimits();
    const pollerCount = getActivePollerCount();

    if (pollerCount > limits.maxConcurrentLiveSessions) {
      markPollFailure(config.matchId);
      updatePollingContext(config.matchId, { status: "degraded" });
      logger.warn("PROVIDER", "provider_rate_limited", {
        matchId: config.matchId,
        reason: "max_concurrent_live_sessions",
        pollerCount,
        max: limits.maxConcurrentLiveSessions,
      });
      scheduleNext(config.matchId, applyJitter(60_000), execute);
      return;
    }

    if (shouldStopPolling(context)) {
      stopPollingSession(config.matchId);
      config.onStop?.();
      return;
    }

    const nextInterval = resolvePollingIntervalMs(context);
    const priorityScore = getMatchPriorityScore({
      teamA: context.teamA,
      teamB: context.teamB,
      seriesName: context.seriesName,
      format: context.format,
    });
    const priorityBand = getPriorityBand(context);
    const quotaDangerLevel = getQuotaDangerLevel(context);
    const retryBudget = getRetryBudget(context);
    const projectedDaily = getProjectedRequestsPerDay(context);
    const health = getPollingHealth(config.matchId);

    if (health && health.pollIntervalMs !== nextInterval) {
      logger.info("PROVIDER", "polling_interval_changed", {
        matchId: config.matchId,
        from: health.pollIntervalMs,
        to: nextInterval,
      });
    }

    updatePollingContext(config.matchId, {
      pollIntervalMs: nextInterval,
      activeViewers: context.activeViewers,
      priorityScore,
      retryBudget,
      dangerLevel: quotaDangerLevel,
    });

    if (shouldDegradePolling(context)) {
      updatePollingContext(config.matchId, { status: "degraded" });
      logger.warn("PROVIDER", "provider_degraded_mode", {
        matchId: config.matchId,
        failedPolls: context.failedPolls,
        pollsLastMinute: context.pollsLastMinute,
        priorityBand,
        quotaDangerLevel,
        projectedDaily,
      });
    }

    const startedAt = Date.now();
    markPollStarted(config.matchId);
    logger.debug("PROVIDER", "provider_poll_started", {
      matchId: config.matchId,
      provider: config.providerName,
      mode: config.providerMode,
    });

    try {
      if (context.failedPolls >= retryBudget) {
        markPollFailure(config.matchId);
        updatePollingContext(config.matchId, { status: "degraded" });
        logger.warn("PROVIDER", "provider_retry_budget_exhausted", {
          matchId: config.matchId,
          failedPolls: context.failedPolls,
          retryBudget,
        });
      } else {
        await config.poll();
        markPollSuccess(config.matchId, Date.now() - startedAt);
        logger.debug("PROVIDER", "provider_poll_success", {
          matchId: config.matchId,
          latencyMs: Date.now() - startedAt,
        });
      }
    } catch (err) {
      markPollFailure(config.matchId);
      logger.warn("PROVIDER", "provider_poll_failed", {
        matchId: config.matchId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    if (quotaDangerLevel === "critical" && priorityBand === "low") {
      updatePollingContext(config.matchId, { status: "degraded" });
      logger.warn("PROVIDER", "provider_quota_safety_alert", {
        matchId: config.matchId,
        action: "downgrade_low_priority_match",
        quotaDangerLevel,
        projectedDaily,
      });
    }

    scheduleNext(config.matchId, applyJitter(nextInterval), execute);
  };

  scheduleNext(config.matchId, 0, execute);
}

export function stopPollingSession(matchId: string) {
  const session = sessions.get(matchId);
  if (!session) return;

  session.running = false;
  if (session.timer) {
    clearTimeout(session.timer);
    session.timer = null;
  }

  sessions.delete(matchId);
  markPollingStopped(matchId);
  removePollingHealth(matchId);
}

export function hasPollingSession(matchId: string) {
  return sessions.get(matchId)?.running === true;
}
