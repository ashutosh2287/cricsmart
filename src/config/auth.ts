import { timingSafeEqual } from "crypto";

export type AuthRole = "public" | "operator" | "admin" | "internal";

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function parseRolloutPhase(): number {
  const fallback = process.env.NODE_ENV === "production" ? 4 : 1;
  const raw = parseNumber(process.env.AUTH_ROLLOUT_PHASE, fallback);
  return Math.max(1, Math.min(4, Math.trunc(raw)));
}

export function isAuthEnabled(): boolean {
  return parseBoolean(process.env.AUTH_ENABLED, process.env.NODE_ENV === "production");
}

export function isAdminProtectionEnabled(): boolean {
  return isAuthEnabled() && parseRolloutPhase() >= 3;
}

export function isInternalProtectionEnabled(): boolean {
  return isAuthEnabled() && parseRolloutPhase() >= 2;
}

export function isSseAuthEnabled(): boolean {
  return isAuthEnabled() && parseBoolean(process.env.AUTH_ENFORCE_SSE, false);
}

export function isDevAuthBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return parseBoolean(process.env.AUTH_ALLOW_DEV_BYPASS, false);
}

export function getAuthCookieName(): string {
  return process.env.AUTH_COOKIE_NAME?.trim() || "cricsmart_session";
}

export function getAuthSessionTtlSeconds(): number {
  return Math.max(300, parseNumber(process.env.AUTH_SESSION_TTL_SECONDS, 60 * 60 * 24 * 7));
}

export function getAuthSessionRotateSeconds(): number {
  return Math.max(60, parseNumber(process.env.AUTH_SESSION_ROTATE_SECONDS, 60 * 30));
}

export function getAuthRateLimitWindowSeconds(): number {
  return Math.max(10, parseNumber(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS, 60));
}

export function getAuthRateLimitMaxAttempts(): number {
  return Math.max(1, parseNumber(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS, 6));
}

export function getAuthCookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export function getAuthCookieSameSite(): "lax" | "strict" {
  return "lax";
}

function safeBuffer(value: string): Buffer {
  return Buffer.from(value, "utf8");
}

export function safeCredentialCompare(left: string, right: string): boolean {
  const leftBuffer = safeBuffer(left);
  const rightBuffer = safeBuffer(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
