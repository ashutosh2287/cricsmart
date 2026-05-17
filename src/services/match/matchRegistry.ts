import { getRedis } from "@/services/storage/redisClient";
import type { SimulationLifecycleState } from "@/services/simulation/simulation-lifecycle";
import type {
  LiveSessionProvider,
  LiveSessionState,
  SessionSourceType,
} from "@/types/liveSession";

export const MATCH_LIST_KEY = "matches:list";
export const getMatchMetaKey = (matchId: string) => `match:${matchId}:meta`;

export type MatchRegistryStatus = "LIVE" | "UPCOMING" | "COMPLETED";
export type MatchRegistryType = "LIVE" | "SIMULATION";
export type MatchReconnectHealth = "healthy" | "stale" | "disconnected";
export type LiveSessionStatus =
  | "bootstrapping"
  | "live"
  | "recovering"
  | "degraded"
  | "stopped";

export type MatchRegistryRecord = {
  matchId: string;
  slug?: string;
  teamA: string;
  teamB: string;
  status: MatchRegistryStatus;
  type: MatchRegistryType;
  sessionState?: LiveSessionState;
  provider?: LiveSessionProvider;
  sourceType?: SessionSourceType;
  externalMatchId?: string;
  providerExternalMatchId?: string;
  providerName?: string;
  providerRetryPolicy?: string;
  liveSessionStatus?: LiveSessionStatus;
  sessionOwner?: string;
  sessionOwnerAcquiredAt?: number;
  sessionIdempotencyKey?: string;
  ingestionRunning?: boolean;
  workerRunning?: boolean;
  lastRecoveryAt?: number;
  seriesName?: string;
  format?: string;
  scheduledStart?: string;
  currentRuns?: number;
  currentWickets?: number;
  currentOver?: number;
  currentBall?: number;
  score?: string;
  overDisplay?: string;
  commentaryPreview?: string;
  createdAt?: number;
  lastUpdateAt: number;
  lastHeartbeatAt?: number;
  heartbeatFresh?: boolean;
  reconnectHealth?: MatchReconnectHealth;
  isLiveConnected?: boolean;
  simulationLifecycle?: SimulationLifecycleState;
};

const LIVE_TERMINAL_STATES = new Set<LiveSessionState>(["COMPLETED", "FAILED"]);

function toOptionalNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function deriveRegistryStatus(
  type: MatchRegistryType,
  sessionState?: LiveSessionState,
  explicitStatus?: MatchRegistryStatus
): MatchRegistryStatus {
  if (explicitStatus) return explicitStatus;
  if (type !== "LIVE") return "UPCOMING";
  if (!sessionState) return "LIVE";
  if (sessionState === "COMPLETED") return "COMPLETED";
  return "LIVE";
}

function decodeRecord(
  raw: Record<string, string>,
  fallbackMatchId: string
): MatchRegistryRecord {
  const type = (raw.type as MatchRegistryType) ?? "SIMULATION";
  const sessionState = toOptionalString(raw.sessionState) as LiveSessionState | undefined;

  return {
    matchId: raw.matchId ?? fallbackMatchId,
    slug: toOptionalString(raw.slug),
    teamA: raw.teamA ?? "Team A",
    teamB: raw.teamB ?? "Team B",
    status: deriveRegistryStatus(
      type,
      sessionState,
      (raw.status as MatchRegistryStatus) ?? undefined
    ),
    type,
    sessionState,
    provider: toOptionalString(raw.provider) as LiveSessionProvider | undefined,
    sourceType: toOptionalString(raw.sourceType) as SessionSourceType | undefined,
    externalMatchId: toOptionalString(raw.externalMatchId),
    providerExternalMatchId: toOptionalString(raw.providerExternalMatchId),
    providerName: toOptionalString(raw.providerName),
    providerRetryPolicy: toOptionalString(raw.providerRetryPolicy),
    liveSessionStatus: toOptionalString(raw.liveSessionStatus) as LiveSessionStatus | undefined,
    sessionOwner: toOptionalString(raw.sessionOwner),
    sessionOwnerAcquiredAt: toOptionalNumber(raw.sessionOwnerAcquiredAt),
    sessionIdempotencyKey: toOptionalString(raw.sessionIdempotencyKey),
    ingestionRunning: toBool(raw.ingestionRunning),
    workerRunning: toBool(raw.workerRunning),
    lastRecoveryAt: toOptionalNumber(raw.lastRecoveryAt),
    seriesName: toOptionalString(raw.seriesName),
    format: toOptionalString(raw.format),
    scheduledStart: toOptionalString(raw.scheduledStart),
    currentRuns: toOptionalNumber(raw.currentRuns),
    currentWickets: toOptionalNumber(raw.currentWickets),
    currentOver: toOptionalNumber(raw.currentOver),
    currentBall: toOptionalNumber(raw.currentBall),
    score: toOptionalString(raw.score),
    overDisplay: toOptionalString(raw.overDisplay),
    commentaryPreview: toOptionalString(raw.commentaryPreview),
    createdAt: toOptionalNumber(raw.createdAt),
    lastUpdateAt: toOptionalNumber(raw.lastUpdateAt) ?? Date.now(),
    lastHeartbeatAt: toOptionalNumber(raw.lastHeartbeatAt),
    heartbeatFresh: toBool(raw.heartbeatFresh),
    reconnectHealth: toOptionalString(raw.reconnectHealth) as MatchReconnectHealth | undefined,
    isLiveConnected: toBool(raw.isLiveConnected),
    simulationLifecycle: toOptionalString(raw.simulationLifecycle) as
      | SimulationLifecycleState
      | undefined,
  };
}

function encodeRecord(record: MatchRegistryRecord): Record<string, string> {
  const encoded: Record<string, string> = {
    matchId: record.matchId,
    teamA: record.teamA,
    teamB: record.teamB,
    status: deriveRegistryStatus(record.type, record.sessionState, record.status),
    type: record.type,
    lastUpdateAt: String(record.lastUpdateAt),
  };

  if (record.slug) encoded.slug = record.slug;
  if (record.sessionState) encoded.sessionState = record.sessionState;
  if (record.provider) encoded.provider = record.provider;
  if (record.sourceType) encoded.sourceType = record.sourceType;
  if (record.externalMatchId) encoded.externalMatchId = record.externalMatchId;
  if (record.providerExternalMatchId) encoded.providerExternalMatchId = record.providerExternalMatchId;
  if (record.providerName) encoded.providerName = record.providerName;
  if (record.providerRetryPolicy) encoded.providerRetryPolicy = record.providerRetryPolicy;
  if (record.liveSessionStatus) encoded.liveSessionStatus = record.liveSessionStatus;
  if (record.sessionOwner) encoded.sessionOwner = record.sessionOwner;
  if (record.sessionOwnerAcquiredAt !== undefined) encoded.sessionOwnerAcquiredAt = String(record.sessionOwnerAcquiredAt);
  if (record.sessionIdempotencyKey) encoded.sessionIdempotencyKey = record.sessionIdempotencyKey;
  if (record.ingestionRunning !== undefined) encoded.ingestionRunning = String(record.ingestionRunning);
  if (record.workerRunning !== undefined) encoded.workerRunning = String(record.workerRunning);
  if (record.lastRecoveryAt !== undefined) encoded.lastRecoveryAt = String(record.lastRecoveryAt);
  if (record.seriesName) encoded.seriesName = record.seriesName;
  if (record.format) encoded.format = record.format;
  if (record.scheduledStart) encoded.scheduledStart = record.scheduledStart;
  if (record.currentRuns !== undefined) encoded.currentRuns = String(record.currentRuns);
  if (record.currentWickets !== undefined) encoded.currentWickets = String(record.currentWickets);
  if (record.currentOver !== undefined) encoded.currentOver = String(record.currentOver);
  if (record.currentBall !== undefined) encoded.currentBall = String(record.currentBall);
  if (record.score) encoded.score = record.score;
  if (record.overDisplay) encoded.overDisplay = record.overDisplay;
  if (record.commentaryPreview) encoded.commentaryPreview = record.commentaryPreview;
  if (record.createdAt !== undefined) encoded.createdAt = String(record.createdAt);
  if (record.lastHeartbeatAt !== undefined) encoded.lastHeartbeatAt = String(record.lastHeartbeatAt);
  if (record.heartbeatFresh !== undefined) encoded.heartbeatFresh = String(record.heartbeatFresh);
  if (record.reconnectHealth) encoded.reconnectHealth = record.reconnectHealth;
  if (record.isLiveConnected !== undefined) encoded.isLiveConnected = String(record.isLiveConnected);
  if (record.simulationLifecycle) encoded.simulationLifecycle = record.simulationLifecycle;

  return encoded;
}

export async function getMatchRegistry(matchId: string): Promise<MatchRegistryRecord | null> {
  const redis = getRedis();
  const raw = await redis.hgetall(getMatchMetaKey(matchId));
  if (!raw || Object.keys(raw).length === 0) {
    return null;
  }
  return decodeRecord(raw, matchId);
}

export async function upsertMatchRegistry(
  payload: Omit<MatchRegistryRecord, "lastUpdateAt"> & { lastUpdateAt?: number }
): Promise<MatchRegistryRecord> {
  const redis = getRedis();
  const existing = await getMatchRegistry(payload.matchId);
  const now = payload.lastUpdateAt ?? Date.now();

  const next: MatchRegistryRecord = {
    ...existing,
    ...payload,
    matchId: payload.matchId,
    slug: payload.slug ?? existing?.slug ?? payload.matchId,
    teamA: payload.teamA,
    teamB: payload.teamB,
    type: payload.type,
    status: deriveRegistryStatus(payload.type, payload.sessionState, payload.status),
    createdAt: payload.createdAt ?? existing?.createdAt ?? now,
    lastUpdateAt: now,
  };

  await redis.hset(getMatchMetaKey(payload.matchId), encodeRecord(next));
  await redis.sadd(MATCH_LIST_KEY, payload.matchId);

  return next;
}

export async function patchMatchRegistry(
  matchId: string,
  patch: Partial<Omit<MatchRegistryRecord, "matchId">>
): Promise<MatchRegistryRecord | null> {
  const existing = await getMatchRegistry(matchId);
  if (!existing) return null;

  const next: MatchRegistryRecord = {
    ...existing,
    ...patch,
    matchId,
    slug: patch.slug ?? existing.slug ?? matchId,
    status: deriveRegistryStatus(
      patch.type ?? existing.type,
      patch.sessionState ?? existing.sessionState,
      patch.status
    ),
    lastUpdateAt: patch.lastUpdateAt ?? Date.now(),
  };

  const redis = getRedis();
  await redis.hset(getMatchMetaKey(matchId), encodeRecord(next));
  return next;
}

export async function listMatchRegistry(): Promise<MatchRegistryRecord[]> {
  const redis = getRedis();
  const ids = await redis.smembers(MATCH_LIST_KEY);
  const rows = await Promise.all(ids.map((id) => getMatchRegistry(id)));

  return rows
    .filter((row): row is MatchRegistryRecord => Boolean(row))
    .sort((a, b) => b.lastUpdateAt - a.lastUpdateAt);
}

export async function findLiveMatchSession(input: {
  externalMatchId: string;
  provider: LiveSessionProvider;
}): Promise<MatchRegistryRecord | null> {
  const rows = await listMatchRegistry();

  return (
    rows.find(
      (row) =>
        row.type === "LIVE" &&
        row.externalMatchId === input.externalMatchId &&
        row.provider === input.provider &&
        !LIVE_TERMINAL_STATES.has(row.sessionState ?? "ACTIVE")
    ) ?? null
  );
}

export async function registerLiveMatchSession(payload: {
  matchId: string;
  slug?: string;
  externalMatchId: string;
  provider: LiveSessionProvider;
  sourceType?: SessionSourceType;
  teamA: string;
  teamB: string;
  seriesName?: string;
  format?: string;
  scheduledStart?: string;
  sessionState?: LiveSessionState;
}): Promise<MatchRegistryRecord> {
  const now = Date.now();
  return upsertMatchRegistry({
    matchId: payload.matchId,
    slug: payload.slug ?? payload.matchId,
    externalMatchId: payload.externalMatchId,
    provider: payload.provider,
    sourceType: payload.sourceType ?? "LIVE",
    teamA: payload.teamA,
    teamB: payload.teamB,
    type: "LIVE",
    sessionState: payload.sessionState ?? "INITIALIZING",
    status: "LIVE",
    seriesName: payload.seriesName,
    format: payload.format,
    scheduledStart: payload.scheduledStart,
    createdAt: now,
    lastHeartbeatAt: now,
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    isLiveConnected: false,
  });
}

async function patchLiveSessionState(
  matchId: string,
  sessionState: LiveSessionState,
  patch?: Partial<MatchRegistryRecord>
) {
  const isLiveConnected =
    sessionState === "ACTIVE"
      ? true
      : sessionState === "COMPLETED"
        ? false
        : patch?.isLiveConnected;

  return patchMatchRegistry(matchId, {
    ...patch,
    sessionState,
    status: deriveRegistryStatus(patch?.type ?? "LIVE", sessionState, patch?.status),
    isLiveConnected,
  });
}

export async function markMatchInitializing(matchId: string) {
  return patchLiveSessionState(matchId, "INITIALIZING", {
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    isLiveConnected: false,
  });
}

export async function markMatchActive(matchId: string) {
  const heartbeatTs = Date.now();
  return patchLiveSessionState(matchId, "ACTIVE", {
    lastHeartbeatAt: heartbeatTs,
    heartbeatFresh: true,
    reconnectHealth: "healthy",
    isLiveConnected: true,
    lastUpdateAt: heartbeatTs,
  });
}

export async function markMatchStale(matchId: string, patch?: Partial<MatchRegistryRecord>) {
  return patchLiveSessionState(matchId, "STALE", {
    ...patch,
    heartbeatFresh: false,
    reconnectHealth: "stale",
    isLiveConnected: false,
  });
}

export async function markMatchDisconnected(matchId: string) {
  return patchLiveSessionState(matchId, "DISCONNECTED", {
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    isLiveConnected: false,
  });
}

export async function markMatchFailed(matchId: string, message?: string) {
  return patchLiveSessionState(matchId, "FAILED", {
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    isLiveConnected: false,
    commentaryPreview: message,
  });
}

export async function touchMatchHeartbeat(
  matchId: string,
  patch?: Partial<
    Pick<
      MatchRegistryRecord,
      | "commentaryPreview"
      | "currentRuns"
      | "currentWickets"
      | "currentOver"
      | "currentBall"
      | "score"
      | "overDisplay"
    >
  >
) {
  const heartbeatTs = Date.now();
  return patchLiveSessionState(matchId, "ACTIVE", {
    ...patch,
    lastHeartbeatAt: heartbeatTs,
    heartbeatFresh: true,
    reconnectHealth: "healthy",
    isLiveConnected: true,
    lastUpdateAt: heartbeatTs,
  });
}

export async function markMatchStopped(matchId: string) {
  return patchLiveSessionState(matchId, "COMPLETED", {
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    isLiveConnected: false,
  });
}
