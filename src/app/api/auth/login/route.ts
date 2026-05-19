import { NextRequest, NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { logger } from "@/lib/logger";
import { findByEmailOrUsername } from "@/lib/repositories/user.repository";
import { isAuthRouteRateLimited } from "@/services/auth/authRateLimit";
import { parseLoginPayload } from "@/services/auth/authValidation";
import { logAuthSensitiveAction } from "@/services/auth/routeGuard";
import { verifyPassword } from "@/services/auth/password";
import { toAuthRole } from "@/services/auth/roles";
import { createAuthSession, setAuthSessionCookie } from "@/services/auth/sessionStore";

function failureResponse(status = 401) {
  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status });
}

export async function POST(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: false, error: "Authentication disabled" }, { status: 404 });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid request payload" }, { status: 400 });
    }

    const payload = parseLoginPayload(body);
    if (!payload.success) {
      return NextResponse.json({ success: false, error: payload.error }, { status: 400 });
    }

    if (await isAuthRouteRateLimited("login", req)) {
      logger.warn("AUTH", "login_rate_limited", { identifier: payload.data.identifier });
      return NextResponse.json(
        { success: false, error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    const user = await findByEmailOrUsername(payload.data.identifier);
    const isValid = user ? await verifyPassword(payload.data.password, user.passwordHash) : false;
    if (!user || !isValid) {
      logger.warn("AUTH", "login_failed", { identifier: payload.data.identifier });
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
