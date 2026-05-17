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
  if (session?.id) {
    await deleteAuthSessionById(session.id);
    logAuthSensitiveAction("logout", {
      route: "/api/auth/logout",
      role: session.user.role,
      username: session.user.username,
    });
  }

  await clearAuthSessionCookie();
  return NextResponse.json({ success: true });
}
