import { NextResponse } from "next/server";
import { getAuthCookieName, isAuthEnabled } from "@/config/auth";
import { logger } from "@/lib/logger";
import { logAuthSensitiveAction } from "@/services/auth/routeGuard";
import {
  clearAuthSessionCookie,
  deleteAuthSessionById,
  getAuthSessionFromRequest,
} from "@/services/auth/sessionStore";
import { readSessionIdFromRequest } from "@/services/auth/sessionLookup";

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: true });
  }

  const session = await getAuthSessionFromRequest(req);
  const sessionId = session?.sessionId ?? readSessionIdFromRequest(req, getAuthCookieName());
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
    sessionId: sessionId ?? undefined,
    role: session?.role,
    username: session?.username,
  });

  await clearAuthSessionCookie();
  return NextResponse.json({ success: true });
}
