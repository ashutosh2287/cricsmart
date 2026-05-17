import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getAuthRateLimitMaxAttempts,
  getAuthRateLimitWindowSeconds,
  isAuthEnabled,
} from "@/config/auth";
import { logger } from "@/lib/logger";
import { findByEmailOrUsername } from "@/lib/repositories/user.repository";
import { logAuthSensitiveAction } from "@/services/auth/routeGuard";
import { verifyPassword } from "@/services/auth/password";
import { toAuthRole } from "@/services/auth/roles";
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
    const body = (await req.json()) as { identifier?: string; username?: string; email?: string; password?: string };
    const identifier = body?.identifier?.trim() || body?.username?.trim() || body?.email?.trim() || "";
    const password = body?.password ?? "";

    if (!identifier || !password) {
      return failureResponse();
    }

    if (await hitRateLimit(req, identifier)) {
      logger.warn("AUTH", "login_rate_limited", { identifier });
      return NextResponse.json({ success: false, error: "Too many attempts" }, { status: 429 });
    }

    const user = await findByEmailOrUsername(identifier);
    const isValid = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !isValid) {
      logger.warn("AUTH", "login_failed", { identifier });
      return failureResponse();
    }

    const session = await createAuthSession({
      userId: user.id,
      username: user.username,
      role: toAuthRole(user.role),
    });
    await setAuthSessionCookie(session);

    logAuthSensitiveAction("login_success", {
      route: "/api/auth/login",
      role: user.role,
      username: user.username,
    });

    return NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    logger.error("AUTH", "login_error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
