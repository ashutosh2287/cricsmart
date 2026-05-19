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
import {
  deleteAuthSessionById as deleteAuthSessionByIdFromStore,
  getAuthSessionById as getAuthSessionByIdFromStore,
  getSessionKey,
  now,
  readSessionIdFromRequest,
  toAuthSession,
} from "./sessionLookup";

function newSessionId(): string {
  return randomBytes(32).toString("base64url");
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
  return deleteAuthSessionByIdFromStore(sessionId);
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

export async function getAuthSessionFromRequest(req: NextRequest | Request): Promise<AuthSession | null> {
  if (!isAuthEnabled()) return null;
  const sessionId = readSessionIdFromRequest(req, getAuthCookieName());
  return getAuthSessionByIdFromStore(sessionId ?? "");
}

export async function getAuthSessionFromServerCookies(): Promise<AuthSession | null> {
  if (!isAuthEnabled()) return null;
  const jar = await cookies();
  const cookieName = getAuthCookieName();
  const sessionId = jar.get(cookieName)?.value;
  if (!sessionId) return null;
  return getAuthSessionByIdFromStore(sessionId);
}

export const getAuthSessionById = getAuthSessionByIdFromStore;
export { readSessionIdFromRequest };

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
