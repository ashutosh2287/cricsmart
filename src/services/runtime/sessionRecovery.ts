import { logger } from "@/lib/logger";
import {
  listMatchRegistry,
  markMatchActive,
  type MatchRegistryRecord,
} from "@/services/match/matchRegistry";
import { startMatch } from "@/services/match/matchManager";
import { initMatch, hydrateMatchState } from "@/services/matchEngine";
import { initPlayerRegistry } from "@/services/player/playerRegistry";
import { startWorker, isWorkerRunning } from "@/services/queue/eventWorker";
import { startLiveMatchIngestor, hasLiveRuntime } from "@/services/ingestion/liveMatchIngestor";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";

type RecoveryDiagnostics = {
  running: boolean;
  lastStartedAt?: number;
  lastCompletedAt?: number;
  recoveredSessions: number;
  skippedSessions: number;
  failedSessions: number;
};

const diagnostics: RecoveryDiagnostics = {
  running: false,
  recoveredSessions: 0,
  skippedSessions: 0,
  failedSessions: 0,
};

const recoveringMatches = new Set<string>();

function isRecoverableLiveSession(row: MatchRegistryRecord): boolean {
  if (row.type !== "LIVE") return false;
  if (!row.externalMatchId) return false;
  return row.sessionState === "ACTIVE" || row.sessionState === "INITIALIZING";
}

async function rehydrateSingleSession(row: MatchRegistryRecord) {
  if (recoveringMatches.has(row.matchId)) {
    diagnostics.skippedSessions += 1;
    logger.warn("RECOVERY", "recovery_skipped", {
      matchId: row.matchId,
      reason: "already_recovering",
    });
    return;
  }

  recoveringMatches.add(row.matchId);
  try {
    startMatch(row.matchId);
    initPlayerRegistry(row.matchId);
    initMatch(row.matchId);

    const storage = new RedisSimulationStorage();
    const stored = await storage.load(row.matchId);
    if (stored?.state) {
      hydrateMatchState(row.matchId, stored.state);
      logger.info("RECOVERY", "session_recovered", { matchId: row.matchId });
    }

    if (!isWorkerRunning(row.matchId)) {
      startWorker(row.matchId);
      logger.info("RECOVERY", "worker_rehydrated", { matchId: row.matchId });
    } else {
      logger.info("RECOVERY", "recovery_skipped", {
        matchId: row.matchId,
        reason: "worker_already_running",
      });
    }

    if (!hasLiveRuntime(row.matchId)) {
      startLiveMatchIngestor(row.matchId, row.externalMatchId!);
      logger.info("RECOVERY", "poller_rehydrated", { matchId: row.matchId });
    } else {
      logger.info("RECOVERY", "recovery_skipped", {
        matchId: row.matchId,
        reason: "poller_already_running",
      });
    }

    await markMatchActive(row.matchId);
    diagnostics.recoveredSessions += 1;
  } catch (error) {
    diagnostics.failedSessions += 1;
    logger.error("RECOVERY", "recovery_failed", {
      matchId: row.matchId,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    recoveringMatches.delete(row.matchId);
  }
}

export async function recoverRuntimeSessions() {
  if (diagnostics.running) {
    logger.warn("RECOVERY", "recovery_skipped", { reason: "already_running" });
    return;
  }

  diagnostics.running = true;
  diagnostics.lastStartedAt = Date.now();

  try {
    const sessions = await listMatchRegistry();
    for (const row of sessions) {
      if (!isRecoverableLiveSession(row)) {
        diagnostics.skippedSessions += 1;
        continue;
      }
      await rehydrateSingleSession(row);
    }
  } catch (error) {
    logger.error("RECOVERY", "recovery_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    diagnostics.running = false;
    diagnostics.lastCompletedAt = Date.now();
  }
}

export function getSessionRecoveryDiagnostics() {
  return {
    ...diagnostics,
    inFlightLocks: recoveringMatches.size,
  };
}
