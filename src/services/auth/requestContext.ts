import type { AuthRole } from "@/config/auth";
import type { AuthSession } from "@/services/auth/authTypes";

const AUTH_REQUEST_HEADERS = {
  sessionId: "x-cricsmart-auth-session-id",
  userId: "x-cricsmart-auth-user-id",
  username: "x-cricsmart-auth-username",
  role: "x-cricsmart-auth-role",
  createdAt: "x-cricsmart-auth-created-at",
  expiresAt: "x-cricsmart-auth-expires-at",
  lastSeenAt: "x-cricsmart-auth-last-seen-at",
} as const;

function encodeHeaderValue(value: string): string {
  return encodeURIComponent(value);
}

function decodeHeaderValue(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function parseTimestamp(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function clearAuthSessionRequestHeaders(target: Headers) {
  for (const headerName of Object.values(AUTH_REQUEST_HEADERS)) {
    target.delete(headerName);
  }
}

export function applyAuthSessionToRequestHeaders(target: Headers, session: AuthSession) {
  target.set(AUTH_REQUEST_HEADERS.sessionId, encodeHeaderValue(session.sessionId));
  target.set(AUTH_REQUEST_HEADERS.userId, encodeHeaderValue(session.userId));
  target.set(AUTH_REQUEST_HEADERS.username, encodeHeaderValue(session.username));
  target.set(AUTH_REQUEST_HEADERS.role, session.role);
  target.set(AUTH_REQUEST_HEADERS.createdAt, String(session.createdAt));
  target.set(AUTH_REQUEST_HEADERS.expiresAt, String(session.expiresAt));
  target.set(AUTH_REQUEST_HEADERS.lastSeenAt, String(session.lastSeenAt));
}

export function readAuthSessionFromHeaders(source: Pick<Headers, "get">): AuthSession | null {
  const sessionId = decodeHeaderValue(source.get(AUTH_REQUEST_HEADERS.sessionId));
  const userId = decodeHeaderValue(source.get(AUTH_REQUEST_HEADERS.userId));
  const username = decodeHeaderValue(source.get(AUTH_REQUEST_HEADERS.username));
  const role = source.get(AUTH_REQUEST_HEADERS.role) as AuthRole | null;
  const createdAt = parseTimestamp(source.get(AUTH_REQUEST_HEADERS.createdAt));
  const expiresAt = parseTimestamp(source.get(AUTH_REQUEST_HEADERS.expiresAt));
  const lastSeenAt = parseTimestamp(source.get(AUTH_REQUEST_HEADERS.lastSeenAt));

  if (!sessionId || !userId || !username || !role || createdAt === null || expiresAt === null || lastSeenAt === null) {
    return null;
  }

  return {
    sessionId,
    userId,
    username,
    role,
    createdAt,
    expiresAt,
    lastSeenAt,
    user: {
      userId,
      username,
      role,
    },
  };
}
