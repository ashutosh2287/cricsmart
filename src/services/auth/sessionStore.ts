import "server-only";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { AuthRole } from "@/config/auth";
import {
  getAuthCookieName,
  getAuthCookieSameSite,
  getAuthCookieSecure,
  getAuthSessionRotateSeconds,
  getAuthSessionTtlSeconds,
  isAuthEnabled,
} from "@/config/auth";
import { logger } from "@/lib/logger";
import { getRedis } from "@/services/storage/redisClient";
import type { AuthSession } from "./authTypes";

const SESSION_KEY_PREFIX = "session:";

function getSessionKey(id: string): string {
  return `${SESSION_KEY_PREFIX}${id}`;
}

function newSessionId(): string {
  return randomBytes(32).toString("base64url");
}

function now(): number {
  return Date.now();
}

type StoredSession = {
  sessionId: string;
  userId: string;
  username: string;
  role: AuthRole;
  createdAt: number;
  expiresAt: number;
  lastSeenAt: number;
};

function parseStoredSession(raw: string | null): StoredSession | null {
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

function toAuthSession(session: StoredSession): AuthSession {
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

export async function createAuthSession(user: { userId: string; username: string; role: AuthRole }): Promise<AuthSession> {
  const sessionId = newSessionId();
  const ttlSeconds = getAuthSessionTtlSeconds();
  const createdAt = now();
  const expiresAt = createdAt + ttlSeconds * 1000;
  const session: StoredSession = {
    sessionId,
    userId: user.userId,
    username: user.username,
    role: user.role,
    createdAt,
    expiresAt,
    lastSeenAt: createdAt,
  };

  const redis = getRedis();
  await redis.set(getSessionKey(sessionId), JSON.stringify(session), "EX", ttlSeconds);

  logger.info("AUTH", "session_created", {
    userId: user.userId,
    username: user.username,
    role: user.role,
  });

  return toAuthSession(session);
}

export async function deleteAuthSessionById(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    const redis = getRedis();
    await redis.del(getSessionKey(sessionId));
  } catch (error) {
    logger.warn("AUTH", "session_delete_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function refreshAuthSession(session: StoredSession): Promise<AuthSession> {
  const redis = getRedis();
  const ttlSeconds = getAuthSessionTtlSeconds();
  const timestamp = now();
  const refreshed: StoredSession = {
    ...session,
    lastSeenAt: timestamp,
    expiresAt: timestamp + ttlSeconds * 1000,
  };
  await redis.set(getSessionKey(session.sessionId), JSON.stringify(refreshed), "EX", ttlSeconds);
  return toAuthSession(refreshed);
}

export async function rotateAuthSession(session: AuthSession): Promise<AuthSession> {
  const nextId = newSessionId();
  const redis = getRedis();
  const ttlSeconds = getAuthSessionTtlSeconds();
  const timestamp = now();

  const rotated: StoredSession = {
    sessionId: nextId,
    userId: session.userId,
    username: session.username,
    role: session.role,
    createdAt: session.createdAt,
    expiresAt: timestamp + ttlSeconds * 1000,
    lastSeenAt: timestamp,
  };

  const multi = redis.multi();
  multi.del(getSessionKey(session.sessionId));
  multi.set(getSessionKey(nextId), JSON.stringify(rotated), "EX", ttlSeconds);
  await multi.exec();

  logger.info("AUTH", "session_rotated", {
    userId: rotated.userId,
    role: rotated.role,
  });

  return toAuthSession(rotated);
}

export async function getAuthSessionById(sessionId: string): Promise<AuthSession | null> {
  if (!isAuthEnabled()) return null;
  if (!sessionId) return null;

  try {
    const redis = getRedis();
    const raw = await redis.get(getSessionKey(sessionId));
    const session = parseStoredSession(raw);
    if (!session) return null;

    if (now() > session.expiresAt) {
      await deleteAuthSessionById(session.sessionId);
      return null;
    }

    return await refreshAuthSession(session);
  } catch (error) {
    logger.warn("AUTH", "session_lookup_failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function readSessionIdFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookieName = getAuthCookieName();
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

export function readSessionIdFromRequest(req: NextRequest | Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  return readSessionIdFromCookieHeader(cookieHeader);
}

export async function getAuthSessionFromRequest(req: NextRequest | Request): Promise<AuthSession | null> {
  if (!isAuthEnabled()) return null;
  const sessionId = readSessionIdFromRequest(req);
  return getAuthSessionById(sessionId ?? "");
}

export async function getAuthSessionFromServerCookies(): Promise<AuthSession | null> {
  if (!isAuthEnabled()) return null;
  const jar = await cookies();
  const cookieName = getAuthCookieName();
  const sessionId = jar.get(cookieName)?.value;
  if (!sessionId) return null;
  return getAuthSessionById(sessionId);
}

export async function setAuthSessionCookie(session: AuthSession): Promise<void> {
  const jar = await cookies();
  const cookieName = getAuthCookieName();
  jar.set(cookieName, session.sessionId, {
    httpOnly: true,
    secure: getAuthCookieSecure(),
    sameSite: getAuthCookieSameSite(),
    path: "/",
    maxAge: getAuthSessionTtlSeconds(),
  });
}

export function shouldRotateSession(session: AuthSession): boolean {
  const rotateEveryMs = getAuthSessionRotateSeconds() * 1000;
  return now() - session.lastSeenAt >= rotateEveryMs;
}

export async function clearAuthSessionCookie(): Promise<void> {
  const jar = await cookies();
  const cookieName = getAuthCookieName();
  jar.set(cookieName, "", {
    httpOnly: true,
    secure: getAuthCookieSecure(),
    sameSite: getAuthCookieSameSite(),
    path: "/",
    maxAge: 0,
  });
}
