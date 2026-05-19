import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
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

  const session = await getAuthSessionFromRequest(req);
  const sessionId = session?.sessionId ?? readSessionIdFromRequest(req);
  if (sessionId) {
    await deleteAuthSessionById(sessionId);
    logAuthSensitiveAction("logout", {
      route: "/api/auth/logout",
      role: session?.role,
      username: session?.username,
    });
  }

  await clearAuthSessionCookie();
  return NextResponse.json({ success: true });
}
