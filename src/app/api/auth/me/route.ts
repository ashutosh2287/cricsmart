import { NextResponse } from "next/server";
import { isAuthEnabled } from "@/config/auth";
import { findById } from "@/lib/repositories/user.repository";
import { toAuthRole } from "@/services/auth/roles";
import {
  clearAuthSessionCookie,
  deleteAuthSessionById,
  getAuthSessionFromRequest,
  rotateAuthSession,
  setAuthSessionCookie,
  shouldRotateSession,
} from "@/services/auth/sessionStore";

export async function GET(req: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ success: true, authEnabled: false, user: null });
  }

  const session = await getAuthSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: true, authEnabled: true, user: null });
  }

  const user = await findById(session.userId);
  if (!user) {
    await deleteAuthSessionById(session.sessionId);
    await clearAuthSessionCookie();
    return NextResponse.json({ success: true, authEnabled: true, user: null });
  }

  if (shouldRotateSession(session)) {
    const rotated = await rotateAuthSession(session);
    await setAuthSessionCookie(rotated);
  }

  return NextResponse.json({
    success: true,
    authEnabled: true,
    user: {
      userId: user.id,
      username: user.username,
      role: toAuthRole(user.role),
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  });
}
