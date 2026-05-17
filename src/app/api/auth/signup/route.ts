import { NextRequest, NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { createUser, findByEmail, findByUsername } from "@/lib/repositories/user.repository";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/services/auth/password";
import { toAuthRole } from "@/services/auth/roles";
import { createAuthSession, setAuthSessionCookie } from "@/services/auth/sessionStore";

const USERNAME_MIN = 3;
const PASSWORD_MIN = 8;

function errorResponse(error: string, status = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string): boolean {
  return username.length >= USERNAME_MIN && /^[a-z0-9_]+$/.test(username);
}

function isStrongEnoughPassword(password: string): boolean {
  return password.length >= PASSWORD_MIN && /[A-Za-z]/.test(password) && /\d/.test(password);
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

    const username = body.username?.trim().toLowerCase() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const confirmPassword = body.confirmPassword ?? "";

    logger.info("AUTH", "signup_validation_input", { email, username });

    if (!username || !email || !password || !confirmPassword) {
      return errorResponse("Username, email, password and confirmPassword are required");
    }

    if (!isValidUsername(username)) {
      return errorResponse("Username must be at least 3 characters and contain only lowercase letters, numbers, or underscores");
    }

    if (!isValidEmail(email)) {
      return errorResponse("Invalid email");
    }

    if (!isStrongEnoughPassword(password)) {
      return errorResponse("Password must be at least 8 characters and include at least one letter and one number");
    }

    if (password !== confirmPassword) {
      return errorResponse("Password mismatch");
    }

    const [existingByEmail, existingByUsername] = await Promise.all([
      findByEmail(email),
      findByUsername(username),
    ]);

    logger.info("AUTH", "signup_duplicate_check", {
      email,
      username,
      existingByEmail: Boolean(existingByEmail),
      existingByUsername: Boolean(existingByUsername),
    });

    if (existingByEmail) {
      return errorResponse("Email already exists", 409);
    }

    if (existingByUsername) {
      return errorResponse("Username already exists", 409);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({
      username,
      email,
      passwordHash,
      role: "public",
    });

    logger.info("AUTH", "signup_user_created", {
      userId: user.id,
      username: user.username,
      email: user.email,
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
