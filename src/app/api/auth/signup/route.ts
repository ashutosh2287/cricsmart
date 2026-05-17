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
  if (!email || email.includes(" ")) return false;
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) return false;
  const domain = email.slice(atIndex + 1);
  if (!domain || domain.startsWith(".") || domain.endsWith(".")) return false;
  const dotIndex = domain.indexOf(".");
  if (dotIndex <= 0 || dotIndex === domain.length - 1) return false;
  return true;
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
