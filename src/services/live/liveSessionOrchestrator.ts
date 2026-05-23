import { randomUUID } from "node:crypto";
import { getMatchState, initMatch } from "@/services/matchEngine";
import { startLiveMatchIngestor, stopLiveMatchIngestor, isLiveMatchIngestorRunning } from "@/services/ingestion/liveMatchIngestor";
import { startWorker, stopWorker, isWorkerRunning } from "@/services/queue/eventWorker";
import { initPlayerRegistry } from "@/services/player/playerRegistry";
import { startMatch, stopMatch, isMatchActive } from "@/services/match/matchManager";
import { RedisSimulationStorage } from "@/services/storage/redisSimulationStorage";
import { getRedis } from "@/services/storage/redisClient";
import {
  getMatchRegistry,
  patchMatchRegistry,
  upsertMatchRegistry,
  type LiveSessionStatus,
} from "@/services/match/matchRegistry";

const LIVE_OWNER_PREFIX = "live-owner";
const LIVE_PROVIDER_NAME = "cricapi";
const LIVE_PROVIDER_RETRY_POLICY = "retry-3-backoff-15s";
const LOCK_TTL_MS = 15_000;
const LIVE_SSE_ALLOWED_STATES = new Set<LiveSessionStatus>([
  "bootstrapping",
  "live",
  "recovering",
]);

type BootstrapArgs = {
  matchId: string;
  teamA: string;
  teamB: string;
  externalMatchId: string;
  idempotencyKey?: string;
};

type BootstrapResult = {
  matchId: string;
  owner: string;
  sessionStatus: LiveSessionStatus;
  alreadyActive: boolean;
  recovered: boolean;
};

function getLockKey(matchId: string) {
  return `lock:match:${matchId}:bootstrap`;
}

async function acquireLock(matchId: string, owner: string) {
  const redis = getRedis();
  const result = await redis.set(getLockKey(matchId), owner, "PX", LOCK_TTL_MS, "NX");
  return result === "OK";
}

async function releaseLock(matchId: string, owner: string) {
  const redis = getRedis();
  const key = getLockKey(matchId);
  const current = await redis.get(key);
  if (current === owner) {
    await redis.del(key);
  }
}

function isSessionRunning(matchId: string) {
  return isMatchActive(matchId) && isLiveMatchIngestorRunning(matchId) && isWorkerRunning(matchId);
}

async function saveRuntimeIfMissing(matchId: string) {
  const storage = new RedisSimulationStorage();
  const existing = await storage.load(matchId);
  if (existing) return;

  const state = getMatchState(matchId);
  if (!state) return;

  await storage.save(matchId, state, {
    isRunning: false,
    isPaused: false,
    speed: 1500,
  });
}

async function patchSessionRuntime(
  matchId: string,
  status: LiveSessionStatus,
  patch?: {
    owner?: string;
    idempotencyKey?: string;
    recovered?: boolean;
  }
) {
  await patchMatchRegistry(matchId, {
    liveSessionStatus: status,
    sessionOwner: patch?.owner,
    sessionOwnerAcquiredAt: patch?.owner ? Date.now() : undefined,
    providerName: LIVE_PROVIDER_NAME,
    providerRetryPolicy: LIVE_PROVIDER_RETRY_POLICY,
    ingestionRunning: isLiveMatchIngestorRunning(matchId),
    workerRunning: isWorkerRunning(matchId),
    isLiveConnected: isLiveMatchIngestorRunning(matchId),
    reconnectHealth:
      status === "degraded" || status === "stopped"
        ? "disconnected"
        : "healthy",
    sessionIdempotencyKey: patch?.idempotencyKey,
    lastRecoveryAt: patch?.recovered ? Date.now() : undefined,
  });
}

export async function bootstrapLiveSession(args: BootstrapArgs): Promise<BootstrapResult> {
  if (!process.env.CRICKET_API_KEY) {
    throw new Error("Missing server-side CRICKET_API_KEY for live provider integration");
  }

  const lockOwner = `${LIVE_OWNER_PREFIX}:${randomUUID()}`;
  const lockAcquired = await acquireLock(args.matchId, lockOwner);

  if (!lockAcquired) {
    const existing = await getMatchRegistry(args.matchId);
    if (existing?.type === "LIVE") {
      return {
        matchId: args.matchId,
        owner: existing.sessionOwner ?? lockOwner,
        sessionStatus: existing.liveSessionStatus ?? "bootstrapping",
        alreadyActive: isSessionRunning(args.matchId),
        recovered: false,
      };
    }
    throw new Error(`Live bootstrap already in progress for ${args.matchId}`);
  }

  try {
    const existing = await getMatchRegistry(args.matchId);
    const owner = existing?.sessionOwner ?? lockOwner;

    await upsertMatchRegistry({
      matchId: args.matchId,
      teamA: args.teamA,
      teamB: args.teamB,
      type: "LIVE",
      status: "LIVE",
      externalMatchId: args.externalMatchId,
      providerExternalMatchId: args.externalMatchId,
      providerName: LIVE_PROVIDER_NAME,
      providerRetryPolicy: LIVE_PROVIDER_RETRY_POLICY,
      liveSessionStatus: "bootstrapping",
      sessionOwner: owner,
      sessionOwnerAcquiredAt: Date.now(),
      sessionIdempotencyKey: args.idempotencyKey ?? existing?.sessionIdempotencyKey,
      ingestionRunning: false,
      workerRunning: false,
      isLiveConnected: false,
      heartbeatFresh: false,
      reconnectHealth: "stale",
    });

    initPlayerRegistry(args.matchId);
    startMatch(args.matchId);
    initMatch(args.matchId);
    const currentState = getMatchState(args.matchId);
    if (currentState) {
      if (currentState.teamA) {
        currentState.teamA.name = args.teamA;
        currentState.teamA.short = args.teamA.slice(0, 3).toUpperCase();
      }
      if (currentState.teamB) {
        currentState.teamB.name = args.teamB;
        currentState.teamB.short = args.teamB.slice(0, 3).toUpperCase();
      }
    }
    await saveRuntimeIfMissing(args.matchId);

    const hadPriorLiveSession =
      existing?.type === "LIVE" &&
      (existing.status === "LIVE" ||
        existing.liveSessionStatus === "live" ||
        existing.liveSessionStatus === "degraded" ||
        existing.liveSessionStatus === "recovering");
    const shouldRecover =
      hadPriorLiveSession &&
      (!isLiveMatchIngestorRunning(args.matchId) ||
        !isWorkerRunning(args.matchId) ||
        existing?.liveSessionStatus === "degraded");

    if (shouldRecover) {
      await patchSessionRuntime(args.matchId, "recovering", {
        owner,
        idempotencyKey: args.idempotencyKey ?? existing?.sessionIdempotencyKey,
        recovered: true,
      });
    }

    if (!isWorkerRunning(args.matchId)) {
      startWorker(args.matchId);
    }
    if (!isLiveMatchIngestorRunning(args.matchId)) {
      startLiveMatchIngestor(args.matchId, args.externalMatchId);
    }
    const isRunning = isSessionRunning(args.matchId);

    await patchSessionRuntime(args.matchId, "live", {
      owner,
      idempotencyKey: args.idempotencyKey ?? existing?.sessionIdempotencyKey,
      recovered: shouldRecover,
    });

    return {
      matchId: args.matchId,
      owner,
      sessionStatus: "live",
      alreadyActive: !shouldRecover && isRunning,
      recovered: shouldRecover,
    };
  } catch (error) {
    await patchMatchRegistry(args.matchId, {
      liveSessionStatus: "degraded",
      reconnectHealth: "disconnected",
      isLiveConnected: false,
      ingestionRunning: isLiveMatchIngestorRunning(args.matchId),
      workerRunning: isWorkerRunning(args.matchId),
    });
    throw error;
  } finally {
    await releaseLock(args.matchId, lockOwner);
  }
}

export async function stopLiveSession(matchId: string) {
  const lockOwner = `${LIVE_OWNER_PREFIX}:stop:${randomUUID()}`;
  const lockAcquired = await acquireLock(matchId, lockOwner);
  if (!lockAcquired) {
    return { matchId, stopped: false };
  }

  try {
    stopLiveMatchIngestor(matchId);
    stopWorker(matchId);
    stopMatch(matchId);

    await patchMatchRegistry(matchId, {
      liveSessionStatus: "stopped",
      ingestionRunning: false,
      workerRunning: false,
      isLiveConnected: false,
      reconnectHealth: "disconnected",
    });

    return { matchId, stopped: true };
  } finally {
    await releaseLock(matchId, lockOwner);
  }
}

export async function validateLiveSessionForSse(matchId: string) {
  const registry = await getMatchRegistry(matchId);
  if (!registry || registry.type !== "LIVE") {
    // Non-live sessions use SSE for simulation/replay updates, so pass through.
    return {
      allowSse: true,
      reason: "non-live-pass-through",
    };
  }

  const sessionStatus = registry.liveSessionStatus ?? "degraded";
  const allowSse = LIVE_SSE_ALLOWED_STATES.has(sessionStatus);

  if (sessionStatus === "stopped") {
    return {
      allowSse: true,
      reason: "stopped-allowing-recovery",
    };
  }

  return {
    allowSse,
    reason: allowSse ? "ok" : sessionStatus,
  };
}
