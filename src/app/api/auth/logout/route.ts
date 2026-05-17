import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { logAuthSensitiveAction } from "@/services/auth/routeGuard";
import {
  clearAuthSessionCookie,
  deleteAuthSessionById,
  getAuthSessionFromRequest,
} from "@/services/auth/sessionStore";

export async function POST(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: true });
  }

  const session = await getAuthSessionFromRequest(req);
  if (session?.sessionId) {
    await deleteAuthSessionById(session.sessionId);
    logAuthSensitiveAction("logout", {
      route: "/api/auth/logout",
      role: session.role,
      username: session.username,
    });
  }

  await clearAuthSessionCookie();
  return NextResponse.json({ success: true });
}
