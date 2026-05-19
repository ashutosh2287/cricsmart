import type { NextRequest } from "next/server";
import type { AuthRole } from "@/config/auth";
import { getAuthSessionTtlSeconds, isAuthEnabled } from "@/config/auth";
import { getRedis } from "@/services/storage/redisClient";
import type { AuthSession } from "./authTypes";

const SESSION_KEY_PREFIX = "session:";
const SESSION_REFRESH_GRACE_SECONDS = 15;

type StoredSession = {
  sessionId: string;
  userId: string;
  username: string;
  role: AuthRole;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
};

export function getSessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`;
}

export function now(): number {
  return Date.now();
}

export function parseStoredSession(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.sessionId || !parsed?.userId || !parsed?.username || !parsed?.role || !parsed?.expiresAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function toAuthSession(session: StoredSession): AuthSession {
  return {
    sessionId: session.sessionId,
    userId: session.userId,
    username: session.username,
    role: session.role,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    lastSeenAt: session.lastSeenAt,
    user: {
      userId: session.userId,
      username: session.username,
      role: session.role,
    },
  };
}

export async function deleteAuthSessionById(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const redis = getRedis();
  await redis.del(getSessionKey(sessionId));
}

async function refreshAuthSession(session: StoredSession): Promise<AuthSession> {
  const redis = getRedis();
  const ttlSeconds = getAuthSessionTtlSeconds();
  const refreshed: StoredSession = {
    ...session,
    lastSeenAt: now(),
    expiresAt: now() + ttlSeconds * 1000,
  };
  await redis.set(getSessionKey(session.sessionId), JSON.stringify(refreshed), "EX", ttlSeconds);
  return toAuthSession(refreshed);
}

export async function getAuthSessionById(sessionId: string): Promise<AuthSession | null> {
  if (!isAuthEnabled()) return null;
  if (!sessionId) return null;

  const redis = getRedis();
  const raw = await redis.get(getSessionKey(sessionId));
  const session = parseStoredSession(raw);
  if (!session) return null;

  if (now() > session.expiresAt) {
    await deleteAuthSessionById(session.sessionId);
    return null;
  }

  if (now() - session.lastSeenAt >= SESSION_REFRESH_GRACE_SECONDS * 1000) {
    return await refreshAuthSession(session);
  }

  return toAuthSession(session);
}

export function readSessionIdFromCookieHeader(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) return null;
  const segments = cookieHeader.split(";");
  for (const segment of segments) {
    const [name, ...rest] = segment.trim().split("=");
    if (name !== cookieName) continue;
    const value = rest.join("=");
    if (!value) return null;
    return decodeURIComponent(value);
  }
  return null;
}

export function readSessionIdFromRequest(req: NextRequest | Request, cookieName: string): string | null {
  const cookieHeader = req.headers.get("cookie");
  return readSessionIdFromCookieHeader(cookieHeader, cookieName);
}
