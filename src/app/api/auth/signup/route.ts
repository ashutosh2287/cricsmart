import { NextRequest, NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { createUser, findByEmail, findByUsername } from "@/lib/repositories/user.repository";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/services/auth/password";
import { toAuthRole } from "@/services/auth/roles";
import { createAuthSession, setAuthSessionCookie } from "@/services/auth/sessionStore";

const USERNAME_MIN = 3;
const PASSWORD_MIN = 8;

function invalidCredentials() {
  return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
}

export async function POST(req: NextRequest) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: false, error: "Authentication disabled" }, { status: 404 });
  }

  try {
    const body = (await req.json()) as {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    };

    const username = body.username?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    if (
      username.length < USERNAME_MIN ||
      !/^[A-Za-z0-9_]+$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      password.length < PASSWORD_MIN ||
      password !== confirmPassword
    ) {
      return invalidCredentials();
    }

    const [existingByEmail, existingByUsername] = await Promise.all([
      findByEmail(email),
      findByUsername(username),
    ]);

    if (existingByEmail || existingByUsername) {
      return invalidCredentials();
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      email,
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
