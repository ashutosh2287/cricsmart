import "server-only";

import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
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
import type { AuthSession, AuthUser } from "./authTypes";

const SESSION_KEY_PREFIX = "auth:session:";
const SESSION_REFRESH_GRACE_SECONDS = 15;

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
  id: string;
  user: AuthUser;
  createdAt: number;
  lastSeenAt: number;
};

function parseStoredSession(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession;
    if (!parsed?.id || !parsed?.user?.id || !parsed?.user?.username || !parsed?.user?.role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function createAuthSession(user: AuthUser): Promise<AuthSession> {
  const id = newSessionId();
  const createdAt = now();
  const session: StoredSession = {
    id,
    user,
    createdAt,
    lastSeenAt: createdAt,
  };

  const redis = getRedis();
  await redis.set(getSessionKey(id), JSON.stringify(session), "EX", getAuthSessionTtlSeconds());

  logger.info("AUTH", "session_created", {
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  return session;
}

export async function deleteAuthSessionById(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const redis = getRedis();
  await redis.del(getSessionKey(sessionId));
}

async function refreshAuthSession(session: StoredSession): Promise<StoredSession> {
  const redis = getRedis();
  const refreshed: StoredSession = {
    ...session,
    lastSeenAt: now(),
  };
  await redis.set(getSessionKey(session.id), JSON.stringify(refreshed), "EX", getAuthSessionTtlSeconds());
  return refreshed;
}

export async function rotateAuthSession(session: StoredSession): Promise<StoredSession> {
  const nextId = newSessionId();
  const redis = getRedis();

  const rotated: StoredSession = {
    ...session,
    id: nextId,
    lastSeenAt: now(),
  };

  const multi = redis.multi();
  multi.del(getSessionKey(session.id));
  multi.set(getSessionKey(nextId), JSON.stringify(rotated), "EX", getAuthSessionTtlSeconds());
  await multi.exec();

  logger.info("AUTH", "session_rotated", {
    userId: rotated.user.id,
    role: rotated.user.role,
  });

  return rotated;
}

export async function getAuthSessionById(sessionId: string): Promise<AuthSession | null> {
  if (!isAuthEnabled()) return null;
  if (!sessionId) return null;

  const redis = getRedis();
  const raw = await redis.get(getSessionKey(sessionId));
  const session = parseStoredSession(raw);
  if (!session) return null;

  if (now() - session.lastSeenAt >= SESSION_REFRESH_GRACE_SECONDS * 1000) {
    return refreshAuthSession(session);
  }

  return session;
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
  jar.set(cookieName, session.id, {
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
