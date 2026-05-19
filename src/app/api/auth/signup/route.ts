import { NextRequest, NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { createUser, findByEmail, findByUsername } from "@/lib/repositories/user.repository";
import { logger } from "@/lib/logger";
import { isAuthRouteRateLimited } from "@/services/auth/authRateLimit";
import { parseSignupPayload } from "@/services/auth/authValidation";
import { hashPassword } from "@/services/auth/password";
import { toAuthRole } from "@/services/auth/roles";
import { createAuthSession, setAuthSessionCookie } from "@/services/auth/sessionStore";

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
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
      return errorResponse("Invalid request payload");
    }

    const payload = parseSignupPayload(body);
    if (!payload.success) {
      return errorResponse(payload.error);
    }

    if (await isAuthRouteRateLimited("signup", req)) {
      return errorResponse("Too many signup attempts. Please try again in 15 minutes.", 429);
    }

    const [existingByEmail, existingByUsername] = await Promise.all([
      findByEmail(payload.data.email),
      findByUsername(payload.data.username),
    ]);

    if (existingByEmail) {
      return errorResponse("Email already exists", 409);
    }

    if (existingByUsername) {
      return errorResponse("Username already exists", 409);
    }

    const passwordHash = await hashPassword(payload.data.password);
    const user = await createUser({
      username: payload.data.username,
      email: payload.data.email,
      passwordHash,
      role: "public",
    });

    const session = await createAuthSession({
      userId: user.id,
      username: user.username,
      role: "public",
    });
    await setAuthSessionCookie(session);

    return NextResponse.json({
      success: true,
      user: {
        userId: user.id,
        username: user.username,
        role: toAuthRole(user.role),
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    logger.error("AUTH", "signup_error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 500 });
  }
}
