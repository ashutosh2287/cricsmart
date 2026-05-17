import { timingSafeEqual } from "crypto";

export type AuthRole = "operator" | "admin" | "internal";

type BootstrapUser = {
  id: string;
  username: string;
  password: string;
  role: AuthRole;
};

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
  return Math.max(300, parseNumber(process.env.AUTH_SESSION_TTL_SECONDS, 60 * 60 * 8));
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
  const strict = parseBoolean(process.env.AUTH_COOKIE_STRICT_SAMESITE, false);
  return strict ? "strict" : "lax";
}

function addBootstrapUser(
  users: BootstrapUser[],
  role: AuthRole,
  username: string | undefined,
  password: string | undefined
) {
  const normalizedUsername = username?.trim();
  const normalizedPassword = password?.trim();
  if (!normalizedUsername || !normalizedPassword) return;

  users.push({
    id: `${role}:${normalizedUsername.toLowerCase()}`,
    username: normalizedUsername,
    password: normalizedPassword,
    role,
  });
}

export function getBootstrapUsers(): BootstrapUser[] {
  const users: BootstrapUser[] = [];

  addBootstrapUser(
    users,
    "admin",
    process.env.AUTH_BOOTSTRAP_ADMIN_USERNAME,
    process.env.AUTH_BOOTSTRAP_ADMIN_PASSWORD
  );
  addBootstrapUser(
    users,
    "operator",
    process.env.AUTH_BOOTSTRAP_OPERATOR_USERNAME,
    process.env.AUTH_BOOTSTRAP_OPERATOR_PASSWORD
  );
  addBootstrapUser(
    users,
    "internal",
    process.env.AUTH_BOOTSTRAP_INTERNAL_USERNAME,
    process.env.AUTH_BOOTSTRAP_INTERNAL_PASSWORD
  );

  if (isDevAuthBypassEnabled() && process.env.AUTH_BOOTSTRAP_DEV_USERNAME?.trim()) {
    addBootstrapUser(
      users,
      "admin",
      process.env.AUTH_BOOTSTRAP_DEV_USERNAME,
      process.env.AUTH_BOOTSTRAP_DEV_PASSWORD ?? "dev-password"
    );
  }

  return users;
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

export function validateBootstrapCredentials(
  username: string,
  password: string
): { id: string; username: string; role: AuthRole } | null {
  const users = getBootstrapUsers();
  const normalizedUsername = username.trim().toLowerCase();

  for (const user of users) {
    if (user.username.toLowerCase() !== normalizedUsername) continue;
    if (!safeCredentialCompare(user.password, password)) return null;
    return { id: user.id, username: user.username, role: user.role };
  }

  return null;
}
