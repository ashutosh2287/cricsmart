import { getRedis } from "@/services/storage/redisClient";

export const MATCH_LIST_KEY = "matches:list";
export const getMatchMetaKey = (matchId: string) => `match:${matchId}:meta`;

export type MatchRegistryStatus = "LIVE" | "UPCOMING" | "COMPLETED";
export type MatchRegistryType = "LIVE" | "SIMULATION";
export type MatchReconnectHealth = "healthy" | "stale" | "disconnected";
export type LiveSessionStatus =
  | "bootstrapping"
  | "live"
  | "degraded"
  | "recovering"
  | "stopped";

export type MatchRegistryRecord = {
  matchId: string;
  teamA: string;
  teamB: string;
  status: MatchRegistryStatus;
  type: MatchRegistryType;
  externalMatchId?: string;
  currentRuns?: number;
  currentWickets?: number;
  currentOver?: number;
  currentBall?: number;
  score?: string;
  overDisplay?: string;
  commentaryPreview?: string;
  lastUpdateAt: number;
  lastHeartbeatAt?: number;
  heartbeatFresh?: boolean;
  reconnectHealth?: MatchReconnectHealth;
  isLiveConnected?: boolean;
  liveSessionStatus?: LiveSessionStatus;
  sessionOwner?: string;
  sessionOwnerAcquiredAt?: number;
  providerName?: string;
  providerExternalMatchId?: string;
  providerRetryPolicy?: string;
  ingestionRunning?: boolean;
  workerRunning?: boolean;
  lastRecoveryAt?: number;
  sessionIdempotencyKey?: string;
};

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

function decodeRecord(raw: Record<string, string>, fallbackMatchId: string): MatchRegistryRecord {
  return {
    matchId: raw.matchId ?? fallbackMatchId,
    teamA: raw.teamA ?? "Team A",
    teamB: raw.teamB ?? "Team B",
    status: (raw.status as MatchRegistryStatus) ?? "UPCOMING",
    type: (raw.type as MatchRegistryType) ?? "SIMULATION",
    externalMatchId: toOptionalString(raw.externalMatchId),
    currentRuns: toOptionalNumber(raw.currentRuns),
    currentWickets: toOptionalNumber(raw.currentWickets),
    currentOver: toOptionalNumber(raw.currentOver),
    currentBall: toOptionalNumber(raw.currentBall),
    score: toOptionalString(raw.score),
    overDisplay: toOptionalString(raw.overDisplay),
    commentaryPreview: toOptionalString(raw.commentaryPreview),
    lastUpdateAt: toOptionalNumber(raw.lastUpdateAt) ?? Date.now(),
    lastHeartbeatAt: toOptionalNumber(raw.lastHeartbeatAt),
    heartbeatFresh: toBool(raw.heartbeatFresh),
    reconnectHealth: toOptionalString(raw.reconnectHealth) as MatchReconnectHealth | undefined,
    isLiveConnected: toBool(raw.isLiveConnected),
    liveSessionStatus: toOptionalString(raw.liveSessionStatus) as LiveSessionStatus | undefined,
    sessionOwner: toOptionalString(raw.sessionOwner),
    sessionOwnerAcquiredAt: toOptionalNumber(raw.sessionOwnerAcquiredAt),
    providerName: toOptionalString(raw.providerName),
    providerExternalMatchId: toOptionalString(raw.providerExternalMatchId),
    providerRetryPolicy: toOptionalString(raw.providerRetryPolicy),
    ingestionRunning: toBool(raw.ingestionRunning),
    workerRunning: toBool(raw.workerRunning),
    lastRecoveryAt: toOptionalNumber(raw.lastRecoveryAt),
    sessionIdempotencyKey: toOptionalString(raw.sessionIdempotencyKey),
  };
}

function encodeRecord(record: MatchRegistryRecord): Record<string, string> {
  const encoded: Record<string, string> = {
    matchId: record.matchId,
    teamA: record.teamA,
    teamB: record.teamB,
    status: record.status,
    type: record.type,
    lastUpdateAt: String(record.lastUpdateAt),
  };

  if (record.externalMatchId) encoded.externalMatchId = record.externalMatchId;
  if (record.currentRuns !== undefined) encoded.currentRuns = String(record.currentRuns);
  if (record.currentWickets !== undefined) encoded.currentWickets = String(record.currentWickets);
  if (record.currentOver !== undefined) encoded.currentOver = String(record.currentOver);
  if (record.currentBall !== undefined) encoded.currentBall = String(record.currentBall);
  if (record.score) encoded.score = record.score;
  if (record.overDisplay) encoded.overDisplay = record.overDisplay;
  if (record.commentaryPreview) encoded.commentaryPreview = record.commentaryPreview;
  if (record.lastHeartbeatAt !== undefined) encoded.lastHeartbeatAt = String(record.lastHeartbeatAt);
  if (record.heartbeatFresh !== undefined) encoded.heartbeatFresh = String(record.heartbeatFresh);
  if (record.reconnectHealth) encoded.reconnectHealth = record.reconnectHealth;
  if (record.isLiveConnected !== undefined) encoded.isLiveConnected = String(record.isLiveConnected);
  if (record.liveSessionStatus) encoded.liveSessionStatus = record.liveSessionStatus;
  if (record.sessionOwner) encoded.sessionOwner = record.sessionOwner;
  if (record.sessionOwnerAcquiredAt !== undefined) {
    encoded.sessionOwnerAcquiredAt = String(record.sessionOwnerAcquiredAt);
  }
  if (record.providerName) encoded.providerName = record.providerName;
  if (record.providerExternalMatchId) {
    encoded.providerExternalMatchId = record.providerExternalMatchId;
  }
  if (record.providerRetryPolicy) encoded.providerRetryPolicy = record.providerRetryPolicy;
  if (record.ingestionRunning !== undefined) {
    encoded.ingestionRunning = String(record.ingestionRunning);
  }
  if (record.workerRunning !== undefined) encoded.workerRunning = String(record.workerRunning);
  if (record.lastRecoveryAt !== undefined) encoded.lastRecoveryAt = String(record.lastRecoveryAt);
  if (record.sessionIdempotencyKey) encoded.sessionIdempotencyKey = record.sessionIdempotencyKey;

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

  const next: MatchRegistryRecord = {
    ...existing,
    ...payload,
    matchId: payload.matchId,
    teamA: payload.teamA,
    teamB: payload.teamB,
    status: payload.status,
    type: payload.type,
    lastUpdateAt: payload.lastUpdateAt ?? Date.now(),
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
    lastUpdateAt: patch.lastUpdateAt ?? Date.now(),
  };

  const redis = getRedis();
  await redis.hset(getMatchMetaKey(matchId), encodeRecord(next));
  return next;
}

export async function touchMatchHeartbeat(
  matchId: string,
  patch?: Partial<Pick<MatchRegistryRecord, "commentaryPreview" | "currentRuns" | "currentWickets" | "currentOver" | "currentBall" | "score" | "overDisplay">>
) {
  const heartbeatTs = Date.now();
  const reconnectHealth: MatchReconnectHealth = "healthy";
  return patchMatchRegistry(matchId, {
    ...patch,
    lastHeartbeatAt: heartbeatTs,
    heartbeatFresh: true,
    reconnectHealth,
    isLiveConnected: true,
    status: "LIVE",
    lastUpdateAt: heartbeatTs,
  });
}

export async function markMatchDisconnected(matchId: string) {
  return patchMatchRegistry(matchId, {
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    isLiveConnected: false,
    liveSessionStatus: "degraded",
  });
}

export async function markMatchStopped(matchId: string) {
  return patchMatchRegistry(matchId, {
    status: "COMPLETED",
    heartbeatFresh: false,
    reconnectHealth: "disconnected",
    isLiveConnected: false,
    liveSessionStatus: "stopped",
    ingestionRunning: false,
    workerRunning: false,
  });
}

export async function listMatchRegistry(): Promise<MatchRegistryRecord[]> {
  const redis = getRedis();
  const ids = await redis.smembers(MATCH_LIST_KEY);

  const rows = await Promise.all(ids.map((id) => getMatchRegistry(id)));

  return rows
    .filter((row): row is MatchRegistryRecord => Boolean(row))
    .sort((a, b) => b.lastUpdateAt - a.lastUpdateAt);
}