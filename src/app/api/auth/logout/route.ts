import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { logger } from "@/lib/logger";
import { logAuthSensitiveAction } from "@/services/auth/routeGuard";
import {
  clearAuthSessionCookie,
  deleteAuthSessionById,
  getAuthSessionFromRequest,
  readSessionIdFromRequest,
} from "@/services/auth/sessionStore";

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: true });
  }

  const sessionId = readSessionIdFromRequest(req);
  const session = await getAuthSessionFromRequest(req);
  if (sessionId) {
    try {
      await deleteAuthSessionById(sessionId);
    } catch (error) {
      logger.warn("AUTH", "logout_session_delete_failed", {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  logAuthSensitiveAction("logout", {
    route: "/api/auth/logout",
    sessionId,
    role: session?.role,
    username: session?.username,
  });

  await clearAuthSessionCookie();
  return NextResponse.json({ success: true });
}
