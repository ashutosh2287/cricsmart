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
  resolvePollingIntervalMs,
  shouldDegradePolling,
  shouldStopPolling,
  type PollingContext,
} from "@/services/providers/polling/pollingStrategy";
import type { ProviderMode } from "@/config/providerMode";

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

function scheduleNext(matchId: string, delayMs: number, run: () => Promise<void>) {
  const session = sessions.get(matchId);
  if (!session || !session.running) return;

  if (session.timer) {
    clearTimeout(session.timer);
  }

  session.timer = setTimeout(() => {
    run().catch((err) => {
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
      scheduleNext(config.matchId, 60_000, execute);
      return;
    }

    if (shouldStopPolling(context)) {
      stopPollingSession(config.matchId);
      config.onStop?.();
      return;
    }

    const nextInterval = resolvePollingIntervalMs(context);
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
    });

    if (shouldDegradePolling(context)) {
      updatePollingContext(config.matchId, { status: "degraded" });
      logger.warn("PROVIDER", "provider_degraded_mode", {
        matchId: config.matchId,
        failedPolls: context.failedPolls,
        pollsLastMinute: context.pollsLastMinute,
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
      await config.poll();
      markPollSuccess(config.matchId, Date.now() - startedAt);
      logger.debug("PROVIDER", "provider_poll_success", {
        matchId: config.matchId,
        latencyMs: Date.now() - startedAt,
      });
    } catch (err) {
      markPollFailure(config.matchId);
      logger.warn("PROVIDER", "provider_poll_failed", {
        matchId: config.matchId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    scheduleNext(config.matchId, nextInterval, execute);
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
