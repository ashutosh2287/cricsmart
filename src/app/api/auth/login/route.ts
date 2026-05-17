import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getAuthRateLimitMaxAttempts,
  getAuthRateLimitWindowSeconds,
  isAuthEnabled,
  validateBootstrapCredentials,
} from "@/config/auth";
import { logger } from "@/lib/logger";
import { logAuthSensitiveAction } from "@/services/auth/routeGuard";
import { createAuthSession, setAuthSessionCookie } from "@/services/auth/sessionStore";
import { getRedis } from "@/services/storage/redisClient";

function failureResponse() {
  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
}

function limitKeyForRequest(req: NextRequest, username: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const fingerprint = `${ip}:${username.trim().toLowerCase()}`;
  const hash = createHash("sha256").update(fingerprint).digest("hex");
  return `auth:rate_limit:login:${hash}`;
}

async function hitRateLimit(req: NextRequest, username: string): Promise<boolean> {
  const redis = getRedis();
  const key = limitKeyForRequest(req, username);
  const ttl = getAuthRateLimitWindowSeconds();
  const maxAttempts = getAuthRateLimitMaxAttempts();

  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, ttl);
  }

  return attempts > maxAttempts;
}

export async function POST(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: false, error: "Authentication disabled" }, { status: 404 });
  }

  try {
    const body = (await req.json()) as { username?: string; password?: string };
    const username = body?.username?.trim() ?? "";
    const password = body?.password ?? "";

    if (!username || !password) {
      return failureResponse();
    }

    if (await hitRateLimit(req, username)) {
      logger.warn("AUTH", "login_rate_limited", { username });
      return NextResponse.json({ success: false, error: "Too many attempts" }, { status: 429 });
    }

    const user = validateBootstrapCredentials(username, password);
    if (!user) {
      logger.warn("AUTH", "login_failed", { username });
      return failureResponse();
    }

    const session = await createAuthSession(user);
    await setAuthSessionCookie(session);

    logAuthSensitiveAction("login_success", {
      route: "/api/auth/login",
      role: user.role,
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("AUTH", "login_error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
